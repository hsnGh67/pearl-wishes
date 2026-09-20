import {
  supabase,
  supabaseUrl,
  supabaseAnonKey,
} from "../../config/supabase";
import {
  Artist,
  ArtistCreate,
  validateArtist,
  validateArtistCreate,
} from "../../schema/artist.schema";

/** Must match the deployed function slug in the URL path. */
const ADMIN_ARTIST_FUNCTION = "hyper-service";

export class AdminArtistError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AdminArtistError";
    this.status = status;
  }
}

type ArtistJoinPayload = Record<string, unknown> & {
  artist_districts?: Array<{
    districts?: { id: string; name: string } | null;
  }> | null;
  artist_services?: Array<{
    services?: { id: string; name: string } | null;
  }> | null;
};

function mapArtistFromPayload(row: ArtistJoinPayload): Artist {
  const districts =
    row.artist_districts
      ?.map((ad) =>
        ad.districts
          ? { id: ad.districts.id, name: ad.districts.name }
          : null,
      )
      .filter(
        (d): d is { id: string; name: string } => d !== null,
      ) ?? [];

  const services =
    row.artist_services
      ?.map((as) =>
        as.services
          ? { id: as.services.id, name: as.services.name }
          : null,
      )
      .filter(
        (s): s is { id: string; name: string } => s !== null,
      ) ?? [];

  const {
    artist_districts: _ad,
    artist_services: _as,
    ...rest
  } = row;

  return validateArtist({
    ...rest,
    notes: (rest.notes as string | null | undefined) ?? "",
    districts,
    services,
  });
}

async function callAdminArtist(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new AdminArtistError(
      "You must be logged in as an admin to manage artists.",
      401,
    );
  }

  const functionUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${ADMIN_ARTIST_FUNCTION}`;

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
    throw new AdminArtistError(
      `Could not reach Edge Function at ${functionUrl}. ` +
        `Confirm it is ACTIVE in Supabase Dashboard (a missing function returns 404 and often looks like CORS). ` +
        `(${networkError instanceof Error ? networkError.message : "network error"})`,
    );
  }

  let payload: {
    artist?: unknown;
    ok?: boolean;
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
      throw new AdminArtistError(
        `Edge Function "${ADMIN_ARTIST_FUNCTION}" was not found (404). ` +
          `Update the deployed "${ADMIN_ARTIST_FUNCTION}" function in Supabase Dashboard → Edge Functions ` +
          `with code from supabase/functions/hyper-service/index.ts, turn JWT verification OFF, and ensure status is ACTIVE.`,
        404,
      );
    }

    throw new AdminArtistError(
      payload.error ||
        payload.message ||
        `Failed artist action (HTTP ${response.status})`,
      response.status,
    );
  }

  if (payload.error) {
    const errMsg =
      typeof payload.error === "string"
        ? payload.error
        : "Failed artist action";

    // Old hyper-service only knew how to create users — this means it was not updated.
    if (/full_name is required/i.test(errMsg)) {
      throw new AdminArtistError(
        `Your deployed "hyper-service" Edge Function is outdated. ` +
          `In Supabase Dashboard → Edge Functions → hyper-service, paste the full file ` +
          `supabase/functions/hyper-service/index.ts, turn JWT verification OFF, and Deploy. ` +
          `Then try adding the artist again.`,
        400,
      );
    }

    throw new AdminArtistError(errMsg);
  }

  return payload as Record<string, unknown>;
}

/**
 * Create Auth (email+password) + artists row + junctions via Edge Function.
 */
export const adminCreateArtist = async (
  input: ArtistCreate,
): Promise<Artist> => {
  const validated = validateArtistCreate(input);

  const payload = await callAdminArtist({
    action: "artist_create",
    first_name: validated.first_name.trim(),
    last_name: validated.last_name.trim(),
    phone: validated.phone.trim(),
    email: validated.email.trim().toLowerCase(),
    username: validated.username.trim(),
    password: validated.password,
    notes: validated.notes ?? "",
    is_active: validated.is_active ?? true,
    district_ids: validated.district_ids ?? [],
    service_ids: validated.service_ids ?? [],
  });

  if (!payload.artist) {
    throw new AdminArtistError(
      `Edge Function returned no artist. Confirm ${ADMIN_ARTIST_FUNCTION} is deployed.`,
    );
  }

  return mapArtistFromPayload(
    payload.artist as ArtistJoinPayload,
  );
};

/**
 * Reset / set Auth password for an artist (cannot retrieve current password).
 * Also syncs phone onto Auth when the artists row has a phone.
 */
export const adminSetArtistPassword = async (
  artistId: string,
  password: string,
): Promise<void> => {
  if (!password || password.length < 6) {
    throw new AdminArtistError(
      "Password must be at least 6 characters",
      400,
    );
  }

  await callAdminArtist({
    action: "artist_set_password",
    artist_id: artistId,
    password,
  });
};

/**
 * Sync artist phone onto the linked Auth user (for phone + password panel login).
 */
export const adminSyncArtistAuthPhone = async (
  artistId: string,
  phone: string,
): Promise<void> => {
  const trimmed = phone?.trim() ?? "";
  if (!trimmed) {
    throw new AdminArtistError("Phone is required", 400);
  }

  await callAdminArtist({
    action: "artist_sync_auth_phone",
    artist_id: artistId,
    phone: trimmed,
  });
};

/**
 * Delete Auth user and artists row (junctions cascade).
 */
export const adminDeleteArtist = async (
  artistId: string,
): Promise<void> => {
  await callAdminArtist({
    action: "artist_delete",
    artist_id: artistId,
  });
};