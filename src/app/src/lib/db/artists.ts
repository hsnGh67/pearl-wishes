import { supabase } from "../../config/supabase";
import {
  Artist,
  ArtistUpdate,
  validateArtist,
  validateArtistUpdate,
} from "../../schema/artist.schema";
import { dbLogger } from "./logger";

type ArtistJoinRow = {
  id: string;
  auth_id: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
  username: string;
  notes: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  artist_districts?: Array<{
    district_id: string;
    districts: { id: string; name: string } | null;
  }> | null;
  artist_services?: Array<{
    service_id: string;
    services: { id: string; name: string } | null;
  }> | null;
};

const ARTIST_SELECT = `
  *,
  artist_districts (
    district_id,
    districts ( id, name )
  ),
  artist_services (
    service_id,
    services ( id, name )
  )
`;

function mapArtistRow(row: ArtistJoinRow): Artist {
  const districts =
    row.artist_districts
      ?.map((ad) =>
        ad.districts
          ? { id: ad.districts.id, name: ad.districts.name }
          : null,
      )
      .filter((d): d is { id: string; name: string } => d !== null) ??
    [];

  const services =
    row.artist_services
      ?.map((as) =>
        as.services
          ? { id: as.services.id, name: as.services.name }
          : null,
      )
      .filter((s): s is { id: string; name: string } => s !== null) ??
    [];

  const { artist_districts: _ad, artist_services: _as, ...rest } = row;

  return validateArtist({
    ...rest,
    notes: rest.notes ?? "",
    districts,
    services,
  });
}

/**
 * Get all artists with nested districts and services
 */
export const getAllArtists = async (): Promise<Artist[]> => {
  try {
    dbLogger.info("Fetching all artists", { table: "artists" });

    const { data, error } = await supabase
      .from("artists")
      .select(ARTIST_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch artists", {
        table: "artists",
        error,
      });
      throw error;
    }

    const artists =
      (data as ArtistJoinRow[] | null)?.map(mapArtistRow) ?? [];

    dbLogger.info("Successfully fetched artists", {
      table: "artists",
      data: { count: artists.length },
    });

    return artists;
  } catch (error) {
    dbLogger.error("Error in getAllArtists", { error });
    throw error;
  }
};

/**
 * Get a single artist by ID
 */
export const getArtistById = async (
  id: string,
): Promise<Artist | null> => {
  try {
    dbLogger.info("Fetching artist by ID", {
      table: "artists",
      data: { id },
    });

    const { data, error } = await supabase
      .from("artists")
      .select(ARTIST_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      dbLogger.error("Failed to fetch artist by ID", {
        table: "artists",
        error,
      });
      throw error;
    }

    if (!data) return null;
    return mapArtistRow(data as ArtistJoinRow);
  } catch (error) {
    dbLogger.error("Error in getArtistById", { error });
    throw error;
  }
};

/**
 * Get artist linked to a Supabase Auth user id
 */
export const getArtistByAuthId = async (
  authId: string,
): Promise<Artist | null> => {
  try {
    dbLogger.info("Fetching artist by auth_id", {
      table: "artists",
      data: { authId },
    });

    const { data, error } = await supabase
      .from("artists")
      .select(ARTIST_SELECT)
      .eq("auth_id", authId)
      .maybeSingle();

    if (error) {
      dbLogger.error("Failed to fetch artist by auth_id", {
        table: "artists",
        error,
      });
      throw error;
    }

    if (!data) return null;
    return mapArtistRow(data as ArtistJoinRow);
  } catch (error) {
    dbLogger.error("Error in getArtistByAuthId", { error });
    throw error;
  }
};

/**
 * Replace district assignments for an artist
 */
export const setArtistDistricts = async (
  artistId: string,
  districtIds: string[],
): Promise<void> => {
  try {
    dbLogger.info("Setting artist districts", {
      table: "artist_districts",
      data: { artistId, count: districtIds.length },
    });

    const { error: deleteError } = await supabase
      .from("artist_districts")
      .delete()
      .eq("artist_id", artistId);

    if (deleteError) throw deleteError;

    if (districtIds.length === 0) return;

    const { error: insertError } = await supabase
      .from("artist_districts")
      .insert(
        districtIds.map((district_id) => ({
          artist_id: artistId,
          district_id,
        })),
      );

    if (insertError) throw insertError;
  } catch (error) {
    dbLogger.error("Error in setArtistDistricts", { error });
    throw error;
  }
};

/**
 * Replace service assignments for an artist
 */
export const setArtistServices = async (
  artistId: string,
  serviceIds: string[],
): Promise<void> => {
  try {
    dbLogger.info("Setting artist services", {
      table: "artist_services",
      data: { artistId, count: serviceIds.length },
    });

    const { error: deleteError } = await supabase
      .from("artist_services")
      .delete()
      .eq("artist_id", artistId);

    if (deleteError) throw deleteError;

    if (serviceIds.length === 0) return;

    const { error: insertError } = await supabase
      .from("artist_services")
      .insert(
        serviceIds.map((service_id) => ({
          artist_id: artistId,
          service_id,
        })),
      );

    if (insertError) throw insertError;
  } catch (error) {
    dbLogger.error("Error in setArtistServices", { error });
    throw error;
  }
};

/**
 * Update artist profile fields (no Auth / password).
 * Optionally sync district/service junctions when arrays are provided.
 */
export const updateArtist = async (
  input: ArtistUpdate,
): Promise<Artist> => {
  try {
    const validated = validateArtistUpdate(input);
    const { id, district_ids, service_ids, ...fields } = validated;

    dbLogger.info("Updating artist", {
      table: "artists",
      data: { id },
    });

    const updateFields = Object.fromEntries(
      Object.entries(fields).filter(
        ([key]) =>
          key in input &&
          input[key as keyof ArtistUpdate] !== undefined,
      ),
    );

    if (Object.keys(updateFields).length > 0) {
      const { error } = await supabase
        .from("artists")
        .update({
          ...updateFields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        dbLogger.error("Failed to update artist", {
          table: "artists",
          error,
        });
        throw error;
      }
    }

    if (district_ids !== undefined) {
      await setArtistDistricts(id, district_ids);
    }
    if (service_ids !== undefined) {
      await setArtistServices(id, service_ids);
    }

    const artist = await getArtistById(id);
    if (!artist) {
      throw new Error("Artist not found after update");
    }
    return artist;
  } catch (error) {
    dbLogger.error("Error in updateArtist", { error });
    throw error;
  }
};

/**
 * Toggle / set active flag
 */
export const setArtistActive = async (
  id: string,
  isActive: boolean,
): Promise<Artist> => {
  return updateArtist({ id, is_active: isActive });
};
