/**
 * Admin Edge Function — deployed as slug "hyper-service".
 *
 * Handles:
 *   - Create client/artist users in public.users (phone Auth, no password)
 *   - Nail artist actions (email+password Auth + public.artists):
 *       action: artist_create | artist_set_password | artist_delete
 *
 * Live URL: https://xqanbblitsqasnkbbana.supabase.co/functions/v1/hyper-service
 *
 * Dashboard: turn OFF "Verify JWT with legacy secret" / Enforce JWT — we verify
 * the Bearer token + admin role here.
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
type ArtistAction =
  | "artist_create"
  | "artist_set_password"
  | "artist_delete";

interface RequestBody {
  action?: ArtistAction | string;
  // users create
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
  address?: string | null;
  postal_code?: string | null;
  district?: string | null;
  // artists
  first_name?: string;
  last_name?: string;
  username?: string;
  password?: string;
  notes?: string;
  is_active?: boolean;
  district_ids?: string[];
  service_ids?: string[];
  artist_id?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
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
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

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
      console.error(
        "caller profile lookup failed",
        callerProfileError,
      );
      return jsonResponse(
        { error: "Failed to verify admin" },
        500,
      );
    }

    if (!callerProfile || callerProfile.role !== "admin") {
      return jsonResponse(
        { error: "Forbidden: admin only" },
        403,
      );
    }

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const action = body.action;

    // ── Artist actions ──────────────────────────────────────────────────────
    if (
      action === "artist_create" ||
      action === "artist_set_password" ||
      action === "artist_delete"
    ) {
      if (action === "artist_create") {
        const firstName = body.first_name?.trim() ?? "";
        const lastName = body.last_name?.trim() ?? "";
        const email = body.email?.trim().toLowerCase() ?? "";
        const username = body.username?.trim() ?? "";
        const password = body.password ?? "";
        const phoneRaw = body.phone?.trim() || null;
        const notes = body.notes?.trim() ?? "";
        const isActive = body.is_active !== false;
        const districtIds = body.district_ids ?? [];
        const serviceIds = body.service_ids ?? [];

        if (!firstName || !lastName) {
          return jsonResponse(
            { error: "first_name and last_name are required" },
            400,
          );
        }
        if (!email) {
          return jsonResponse({ error: "email is required" }, 400);
        }
        if (!username) {
          return jsonResponse(
            { error: "username is required" },
            400,
          );
        }
        if (!password || password.length < 6) {
          return jsonResponse(
            { error: "password must be at least 6 characters" },
            400,
          );
        }

        const phone = phoneRaw
          ? normalizePhoneE164(phoneRaw)
          : null;

        const { data: existingEmail } = await adminClient
          .from("artists")
          .select("id")
          .ilike("email", email)
          .maybeSingle();
        if (existingEmail) {
          return jsonResponse(
            { error: "An artist with this email already exists" },
            409,
          );
        }

        const { data: existingUsername } = await adminClient
          .from("artists")
          .select("id")
          .ilike("username", username)
          .maybeSingle();
        if (existingUsername) {
          return jsonResponse(
            {
              error: "An artist with this username already exists",
            },
            409,
          );
        }

        const { data: authData, error: authError } =
          await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            app_metadata: { account_type: "artist" },
            user_metadata: {
              full_name: `${firstName} ${lastName}`.trim(),
              username,
            },
          });

        if (authError || !authData.user) {
          const message =
            authError?.message ?? "Failed to create auth user";
          const isConflict =
            /already|registered|exists|duplicate/i.test(message);
          return jsonResponse(
            { error: message },
            isConflict ? 409 : 400,
          );
        }

        const authId = authData.user.id;

        const { data: inserted, error: insertError } =
          await adminClient
            .from("artists")
            .insert([
              {
                auth_id: authId,
                first_name: firstName,
                last_name: lastName,
                phone,
                email,
                username,
                notes,
                is_active: isActive,
              },
            ])
            .select()
            .single();

        if (insertError || !inserted) {
          console.error("artists insert failed", insertError);
          try {
            await adminClient.auth.admin.deleteUser(authId);
          } catch (cleanupError) {
            console.error("auth cleanup failed", cleanupError);
          }
          const message =
            insertError?.message ??
            "Failed to create artist profile";
          const isConflict =
            insertError?.code === "23505" ||
            /duplicate|unique|conflict/i.test(message);
          return jsonResponse(
            { error: message },
            isConflict ? 409 : 500,
          );
        }

        if (districtIds.length > 0) {
          const { error: distError } = await adminClient
            .from("artist_districts")
            .insert(
              districtIds.map((district_id) => ({
                artist_id: inserted.id,
                district_id,
              })),
            );
          if (distError) {
            console.error(
              "artist_districts insert failed",
              distError,
            );
          }
        }

        if (serviceIds.length > 0) {
          const { error: svcError } = await adminClient
            .from("artist_services")
            .insert(
              serviceIds.map((service_id) => ({
                artist_id: inserted.id,
                service_id,
              })),
            );
          if (svcError) {
            console.error(
              "artist_services insert failed",
              svcError,
            );
          }
        }

        const { data: fullArtist } = await adminClient
          .from("artists")
          .select(
            `
            *,
            artist_districts (
              district_id,
              districts ( id, name )
            ),
            artist_services (
              service_id,
              services ( id, name )
            )
          `,
          )
          .eq("id", inserted.id)
          .single();

        return jsonResponse(
          { artist: fullArtist ?? inserted },
          200,
        );
      }

      if (action === "artist_set_password") {
        const artistId = body.artist_id?.trim() ?? "";
        const password = body.password ?? "";

        if (!artistId) {
          return jsonResponse(
            { error: "artist_id is required" },
            400,
          );
        }
        if (!password || password.length < 6) {
          return jsonResponse(
            { error: "password must be at least 6 characters" },
            400,
          );
        }

        const { data: artist, error: fetchError } =
          await adminClient
            .from("artists")
            .select("id, auth_id")
            .eq("id", artistId)
            .maybeSingle();

        if (fetchError) {
          return jsonResponse(
            { error: "Failed to load artist" },
            500,
          );
        }
        if (!artist) {
          return jsonResponse({ error: "Artist not found" }, 404);
        }
        if (!artist.auth_id) {
          return jsonResponse(
            { error: "Artist has no linked auth account" },
            400,
          );
        }

        const { error: pwError } =
          await adminClient.auth.admin.updateUserById(
            artist.auth_id,
            { password },
          );

        if (pwError) {
          return jsonResponse(
            {
              error:
                pwError.message ?? "Failed to update password",
            },
            400,
          );
        }

        return jsonResponse({ ok: true }, 200);
      }

      // artist_delete
      {
        const artistId = body.artist_id?.trim() ?? "";
        if (!artistId) {
          return jsonResponse(
            { error: "artist_id is required" },
            400,
          );
        }

        const { data: artist, error: fetchError } =
          await adminClient
            .from("artists")
            .select("id, auth_id")
            .eq("id", artistId)
            .maybeSingle();

        if (fetchError) {
          return jsonResponse(
            { error: "Failed to load artist" },
            500,
          );
        }
        if (!artist) {
          return jsonResponse({ error: "Artist not found" }, 404);
        }

        if (artist.auth_id) {
          const { error: authDeleteError } =
            await adminClient.auth.admin.deleteUser(
              artist.auth_id,
            );
          if (authDeleteError) {
            console.error("auth delete failed", authDeleteError);
            return jsonResponse(
              {
                error:
                  authDeleteError.message ??
                  "Failed to delete auth user",
              },
              500,
            );
          }
        }

        const { error: deleteError } = await adminClient
          .from("artists")
          .delete()
          .eq("id", artistId);

        if (deleteError) {
          return jsonResponse(
            {
              error:
                deleteError.message ?? "Failed to delete artist",
            },
            500,
          );
        }

        return jsonResponse({ ok: true }, 200);
      }
    }

    // ── Create public.users (Admin Users) ───────────────────────────────────
    const fullName = body.full_name?.trim() ?? "";
    const phoneRaw = body.phone?.trim() ?? "";
    const emailRaw = body.email?.trim() || null;
    const role = body.role as AssignableRole | undefined;
    const address = body.address?.trim() || null;
    const postalCode = body.postal_code?.trim() || null;
    const district = body.district?.trim() || null;

    if (!fullName) {
      return jsonResponse(
        { error: "full_name is required" },
        400,
      );
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
      return jsonResponse(
        { error: "Invalid phone number" },
        400,
      );
    }

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
      const message =
        authError?.message ?? "Failed to create auth user";
      const isConflict =
        /already|registered|exists|duplicate/i.test(message);
      return jsonResponse(
        { error: message },
        isConflict ? 409 : 400,
      );
    }

    const authId = authData.user.id;

    const { data: insertedUser, error: insertError } =
      await adminClient
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
    console.error("hyper-service unexpected error", error);
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
