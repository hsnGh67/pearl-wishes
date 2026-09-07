import { supabase } from "../../config/supabase";
import {
  ContactMessage,
  ContactMessageCreateInput,
  ContactMessageCreateSchema,
  ContactMessageSchema,
} from "../../schema/contact-message.schema";
import { dbLogger } from "./logger";

const TABLE = "contact_messages";

// INSERT without RETURNING — anon has no SELECT policy so .select() would
// trigger a RETURNING check against the SELECT RLS policy and fail with 42501.
export const createContactMessage = async (
  input: ContactMessageCreateInput,
): Promise<void> => {
  try {
    const validated = ContactMessageCreateSchema.parse(input);

    const { error } = await supabase
      .from(TABLE)
      .insert([validated]);

    if (error) {
      dbLogger.error("Failed to create contact message", {
        error,
      });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in createContactMessage", { error });
    throw error;
  }
};

export const getContactMessages = async (options?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<ContactMessage[]> => {
  try {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    let query = supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (options?.unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      dbLogger.error("Failed to fetch contact messages", {
        error,
      });
      throw error;
    }

    return (data ?? []).map((row) => ContactMessageSchema.parse(row));
  } catch (error) {
    dbLogger.error("Error in getContactMessages", { error });
    throw error;
  }
};

export const markContactMessageAsRead = async (
  id: string,
  is_read: boolean,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({ is_read })
      .eq("id", id);

    if (error) {
      dbLogger.error("Failed to update contact message read status", {
        error,
      });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in markContactMessageAsRead", { error });
    throw error;
  }
};

export const deleteContactMessage = async (
  id: string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", id);

    if (error) {
      dbLogger.error("Failed to delete contact message", { error });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in deleteContactMessage", { error });
    throw error;
  }
};

export const subscribeToContactMessages = (
  callback: () => void,
): (() => void) => {
  const channel = supabase
    .channel("contact_messages_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE },
      () => callback(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
