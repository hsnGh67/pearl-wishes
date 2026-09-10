/**
 * Admin create user Edge Function — deployed as "dynamic-endpoint".
 *
 * Creates a Supabase Auth user (phone, no password) and a public.users row
 * with auth_id set. Callers must be logged-in admins (checked in this function).
 *
 * Live URL: https://xqanbblitsqasnkbbana.supabase.co/functions/v1/dynamic-endpoint
 *
 * Dashboard: turn OFF "Verify JWT with legacy secret" / Enforce JWT — we verify
 * the Bearer token + admin role here. Gateway JWT 401s often omit CORS headers
 * and show up in the browser as "Failed to send a request to the Edge Function".
 *
 * Hosted Supabase injects SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

type AssignableRole = "client" | "artist";

interface CreateAdminUserBody {
  full_name?: string;
  email?: string | null;
  phone?: string;
  role?: string;
  address?: string | null;
  postal_code?: string | null;
  district?: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhoneE164(phone: string): string {
  const trimmed = phone.replace(/\s/g, "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }
  return `+${trimmed.replace(/\D/g, "")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse(
        { error: "Server misconfigured: missing Supabase env" },
        500,
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user: callerAuth },
      error: callerAuthError,
    } = await callerClient.auth.getUser();

    if (callerAuthError || !callerAuth) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: callerProfile, error: callerProfileError } =
      await callerClient
        .from("users")
        .select("id, role")
        .eq("auth_id", callerAuth.id)
        .maybeSingle();

    if (callerProfileError) {
      console.error("caller profile lookup failed", callerProfileError);
      return jsonResponse({ error: "Failed to verify admin" }, 500);
    }

    if (!callerProfile || callerProfile.role !== "admin") {
      return jsonResponse({ error: "Forbidden: admin only" }, 403);
    }

    let body: CreateAdminUserBody;
    try {
      body = (await req.json()) as CreateAdminUserBody;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const fullName = body.full_name?.trim() ?? "";
    const phoneRaw = body.phone?.trim() ?? "";
    const emailRaw = body.email?.trim() || null;
    const role = body.role as AssignableRole | undefined;
    const address = body.address?.trim() || null;
    const postalCode = body.postal_code?.trim() || null;
    const district = body.district?.trim() || null;

    if (!fullName) {
      return jsonResponse({ error: "full_name is required" }, 400);
    }
    if (!phoneRaw) {
      return jsonResponse({ error: "phone is required" }, 400);
    }
    if (role !== "client" && role !== "artist") {
      return jsonResponse(
        { error: "role must be client or artist" },
        400,
      );
    }

    const phone = normalizePhoneE164(phoneRaw);
    if (!phone || phone.length < 8) {
      return jsonResponse({ error: "Invalid phone number" }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existingByPhone } = await adminClient
      .from("users")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingByPhone) {
      return jsonResponse(
        { error: "A user with this phone already exists" },
        409,
      );
    }

    if (emailRaw) {
      const { data: existingByEmail } = await adminClient
        .from("users")
        .select("id")
        .eq("email", emailRaw)
        .maybeSingle();

      if (existingByEmail) {
        return jsonResponse(
          { error: "A user with this email already exists" },
          409,
        );
      }
    }

    const createAuthPayload: {
      phone: string;
      phone_confirm: boolean;
      email?: string;
      email_confirm?: boolean;
      user_metadata: { full_name: string };
    } = {
      phone,
      phone_confirm: true,
      user_metadata: { full_name: fullName },
    };

    if (emailRaw) {
      createAuthPayload.email = emailRaw;
      createAuthPayload.email_confirm = true;
    }

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser(createAuthPayload);

    if (authError || !authData.user) {
      const message = authError?.message ?? "Failed to create auth user";
      const isConflict =
        /already|registered|exists|duplicate/i.test(message);
      return jsonResponse({ error: message }, isConflict ? 409 : 400);
    }

    const authId = authData.user.id;

    const { data: insertedUser, error: insertError } = await adminClient
      .from("users")
      .insert([
        {
          auth_id: authId,
          email: emailRaw,
          full_name: fullName,
          phone,
          role,
          address,
          postal_code: postalCode,
          district,
        },
      ])
      .select()
      .single();

    if (insertError || !insertedUser) {
      console.error("users insert failed", insertError);
      try {
        await adminClient.auth.admin.deleteUser(authId);
      } catch (cleanupError) {
        console.error("auth cleanup failed", cleanupError);
      }

      const message =
        insertError?.message ?? "Failed to create user profile";
      const isConflict =
        insertError?.code === "23505" ||
        /duplicate|unique|conflict/i.test(message);
      return jsonResponse(
        { error: message },
        isConflict ? 409 : 500,
      );
    }

    return jsonResponse({ user: insertedUser }, 200);
  } catch (error) {
    console.error("dynamic-endpoint unexpected error", error);
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error",
      },
      500,
    );
  }
});
