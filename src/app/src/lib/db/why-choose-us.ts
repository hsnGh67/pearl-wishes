import { supabase } from "../../config/supabase";
import {
  WhyCard,
  mapWhyChooseUsItemToWhyCard,
  validateWhyChooseUsItem,
  validateWhyChooseUsItemCreate,
} from "../../schema/why-choose-us.schema";
import { dbLogger } from "./logger";

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

/**
 * Fetch all Why Choose Us cards, ordered for display.
 */
export const getWhyChooseUs = async (): Promise<WhyCard[]> => {
  try {
    dbLogger.info("Fetching why choose us cards", {
      table: "why_choose_us",
    });

    const { data, error } = await supabase
      .from("why_choose_us")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      dbLogger.error("Failed to fetch why choose us cards", {
        table: "why_choose_us",
        error,
      });
      throw error;
    }

    const items =
      data?.map((row) =>
        mapWhyChooseUsItemToWhyCard(validateWhyChooseUsItem(row)),
      ) || [];

    dbLogger.info("Successfully fetched why choose us cards", {
      table: "why_choose_us",
      data: { count: items.length },
    });

    return items;
  } catch (error) {
    dbLogger.error("Error in getWhyChooseUs", { error });
    throw error;
  }
};

/**
 * Persist the full Why Choose Us list.
 * Upserts rows by id and deletes cards that were removed in the admin UI.
 */
export const saveWhyChooseUs = async (
  items: WhyCard[],
): Promise<WhyCard[]> => {
  try {
    dbLogger.info("Saving why choose us cards", {
      table: "why_choose_us",
      data: { count: items.length },
    });

    const { data: existingRows, error: existingError } = await supabase
      .from("why_choose_us")
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
        .from("why_choose_us")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) throw deleteError;
    }

    if (items.length === 0) {
      dbLogger.info("Successfully saved why choose us cards", {
        table: "why_choose_us",
        data: { count: 0 },
      });
      return [];
    }

    const payload = items.map((item, index) =>
      validateWhyChooseUsItemCreate({
        id: isUuid(item.id) ? item.id : crypto.randomUUID(),
        icon: item.icon,
        image_url: item.imageUrl.startsWith("blob:") ? "" : item.imageUrl,
        title: item.title,
        description: item.description,
        sort_order: index,
      }),
    );

    const { data, error } = await supabase
      .from("why_choose_us")
      .upsert(payload, { onConflict: "id" })
      .select()
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const saved =
      data?.map((row) =>
        mapWhyChooseUsItemToWhyCard(validateWhyChooseUsItem(row)),
      ) || [];

    dbLogger.info("Successfully saved why choose us cards", {
      table: "why_choose_us",
      data: { count: saved.length },
    });

    return saved;
  } catch (error) {
    dbLogger.error("Error in saveWhyChooseUs", { error });
    throw error;
  }
};
