import { supabase } from "../../config/supabase";
import {
  AwardCard,
  mapAwardsItemToAwardCard,
  validateAwardsCertificationsItem,
  validateAwardsCertificationsItemCreate,
} from "../../schema/awards-certifications.schema";
import { dbLogger } from "./logger";

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

/**
 * Fetch all Awards & Certifications cards, ordered for display.
 */
export const getAwards = async (): Promise<AwardCard[]> => {
  try {
    dbLogger.info("Fetching awards certifications cards", {
      table: "awards_certifications",
    });

    const { data, error } = await supabase
      .from("awards_certifications")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      dbLogger.error("Failed to fetch awards certifications cards", {
        table: "awards_certifications",
        error,
      });
      throw error;
    }

    const items =
      data?.map((row) =>
        mapAwardsItemToAwardCard(validateAwardsCertificationsItem(row)),
      ) || [];

    dbLogger.info("Successfully fetched awards certifications cards", {
      table: "awards_certifications",
      data: { count: items.length },
    });

    return items;
  } catch (error) {
    dbLogger.error("Error in getAwards", { error });
    throw error;
  }
};

/**
 * Persist the full Awards & Certifications list.
 * Upserts rows by id and deletes cards that were removed in the admin UI.
 */
export const saveAwards = async (items: AwardCard[]): Promise<AwardCard[]> => {
  try {
    dbLogger.info("Saving awards certifications cards", {
      table: "awards_certifications",
      data: { count: items.length },
    });

    const { data: existingRows, error: existingError } = await supabase
      .from("awards_certifications")
      .select("id");

    if (existingError) throw existingError;

    const keepIds = new Set(
      items.map((item) => item.id).filter((id) => isUuid(id)),
    );
    const idsToDelete =
      existingRows
        ?.map((row) => row.id as string)
        .filter((id) => !keepIds.has(id)) || [];

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("awards_certifications")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) throw deleteError;
    }

    if (items.length === 0) {
      dbLogger.info("Successfully saved awards certifications cards", {
        table: "awards_certifications",
        data: { count: 0 },
      });
      return [];
    }

    const payload = items.map((item, index) =>
      validateAwardsCertificationsItemCreate({
        id: isUuid(item.id) ? item.id : crypto.randomUUID(),
        image_url: item.imageUrl.startsWith("blob:") ? "" : item.imageUrl,
        name: item.name,
        year: item.year,
        issuer: item.issuer,
        sort_order: index,
      }),
    );

    const { data, error } = await supabase
      .from("awards_certifications")
      .upsert(payload, { onConflict: "id" })
      .select()
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const saved =
      data?.map((row) =>
        mapAwardsItemToAwardCard(validateAwardsCertificationsItem(row)),
      ) || [];

    dbLogger.info("Successfully saved awards certifications cards", {
      table: "awards_certifications",
      data: { count: saved.length },
    });

    return saved;
  } catch (error) {
    dbLogger.error("Error in saveAwards", { error });
    throw error;
  }
};
