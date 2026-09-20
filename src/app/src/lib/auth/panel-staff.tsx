import type { User as AuthUser } from "@supabase/supabase-js";
import { syncProfile } from "./profile-sync";
import { getArtistByAuthId } from "../db/artists";
import { User, UserRole } from "../../schema/user.schema";
import type { Artist } from "../../schema/artist.schema";

function getAccountType(
  authUser: AuthUser,
): string | undefined {
  return (
    (
      authUser.app_metadata as
        { account_type?: string } | undefined
    )?.account_type ??
    (
      authUser.user_metadata as
        { account_type?: string } | undefined
    )?.account_type
  );
}

export type PanelStaff = {
  profile: User | null;
  artist: Artist | null;
  canAccessAdmin: boolean;
};

/**
 * Resolve admin panel access for an Auth user (users.admin or active artist).
 */
export async function resolvePanelStaff(
  authUser: AuthUser,
): Promise<PanelStaff> {
  const accountType = getAccountType(authUser);

  if (accountType === "artist") {
    const artist = await getArtistByAuthId(authUser.id);
    return {
      profile: null,
      artist,
      canAccessAdmin: Boolean(artist?.is_active),
    };
  }

  const profile = await syncProfile(authUser);
  if (profile?.role === UserRole.ADMIN) {
    return {
      profile,
      artist: null,
      canAccessAdmin: true,
    };
  }

  // Fallback: linked artist row without account_type metadata
  const artist = await getArtistByAuthId(authUser.id);
  if (artist?.is_active) {
    return {
      profile,
      artist,
      canAccessAdmin: true,
    };
  }

  return {
    profile,
    artist: null,
    canAccessAdmin: false,
  };
}