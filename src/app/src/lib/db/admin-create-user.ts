import {
  supabase,
  supabaseUrl,
  supabaseAnonKey,
} from "../../config/supabase";
import {
  User,
  UserRole,
  ASSIGNABLE_USER_ROLES,
  validateUser,
} from "../../schema/user.schema";
import { normalizePhone } from "../constants/country-codes";

/** Must match the deployed function slug in the URL path. */
const ADMIN_CREATE_USER_FUNCTION = "hyper-service";

export type AdminCreateUserInput = {
  full_name: string;
  email?: string | null;
  phone: string;
  role: (typeof ASSIGNABLE_USER_ROLES)[number];
  address?: string | null;
  postal_code?: string | null;
  district?: string | null;
};

export class AdminCreateUserError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AdminCreateUserError";
    this.status = status;
  }
}

/**
 * Admin Add User: creates Auth (phone, no password) + public.users with auth_id
 * via the deployed Edge Function (hyper-service).
 *
 * Uses raw fetch (not functions.invoke) so 404 / gateway errors surface clearly.
 * A missing function often looks like a CORS failure in the browser because the
 * Supabase gateway 404 omits content-type from Access-Control-Allow-Headers.
 */
export const adminCreateUser = async (
  input: AdminCreateUserInput,
): Promise<User> => {
  if (
    input.role !== UserRole.CLIENT &&
    input.role !== UserRole.ARTIST
  ) {
    throw new AdminCreateUserError(
      "role must be client or artist",
      400,
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new AdminCreateUserError(
      "You must be logged in as an admin to create users.",
      401,
    );
  }

  const phone = normalizePhone(input.phone);
  const body = {
    full_name: input.full_name.trim(),
    email: input.email?.trim() || null,
    phone,
    role: input.role,
    address: input.address?.trim() || null,
    postal_code: input.postal_code?.trim() || null,
    district: input.district?.trim() || null,
  };

  const functionUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${ADMIN_CREATE_USER_FUNCTION}`;

  let response: Response;
  try {
    response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    throw new AdminCreateUserError(
      `Could not reach Edge Function at ${functionUrl}. ` +
        `Confirm it is ACTIVE in Supabase Dashboard (a missing function returns 404 and often looks like CORS). ` +
        `(${networkError instanceof Error ? networkError.message : "network error"})`,
    );
  }

  let payload: {
    user?: unknown;
    error?: string;
    message?: string;
    code?: string;
  } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    // non-JSON body
  }

  if (!response.ok) {
    if (
      response.status === 404 ||
      payload.code === "NOT_FOUND" ||
      /not found/i.test(payload.message ?? "")
    ) {
      throw new AdminCreateUserError(
        `Edge Function "${ADMIN_CREATE_USER_FUNCTION}" was not found (404). ` +
          `Deploy it in Supabase Dashboard → Edge Functions, name it exactly "${ADMIN_CREATE_USER_FUNCTION}", ` +
          `paste code from supabase/functions/hyper-service/index.ts, turn JWT verification OFF, and ensure status is ACTIVE.`,
        404,
      );
    }

    throw new AdminCreateUserError(
      payload.error ||
        payload.message ||
        `Failed to create user (HTTP ${response.status})`,
      response.status,
    );
  }

  if (payload.error) {
    throw new AdminCreateUserError(
      typeof payload.error === "string"
        ? payload.error
        : "Failed to create user",
    );
  }

  if (!payload.user) {
    throw new AdminCreateUserError(
      `Edge Function returned no user. Confirm ${ADMIN_CREATE_USER_FUNCTION} is deployed.`,
    );
  }

  const userRow = payload.user as Record<string, unknown>;
  return validateUser({
    ...userRow,
    notes: userRow.notes ?? [],
    bookings: userRow.bookings ?? [],
    workshops: userRow.workshops ?? [],
  });
};