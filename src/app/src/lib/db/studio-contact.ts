import { supabase } from "../../config/supabase";
import {
  BusinessHour,
  HourRow,
  StudioContact,
  StudioContactCreate,
  mapBusinessHourToHourRow,
  validateBusinessHour,
  validateBusinessHourCreate,
  validateStudioContact,
  validateStudioContactCreate,
} from "../../schema/studio-contact.schema";
import { dbLogger } from "./logger";

export interface ContactAndHours {
  contact: StudioContact | null;
  hours: BusinessHour[];
}

export interface SaveContactAndHoursInput {
  contact: StudioContactCreate & { id?: string };
  hours: HourRow[];
}

export interface SavedContactAndHours {
  contact: StudioContact;
  hours: HourRow[];
}

/**
 * Fetch the singleton contact row and all business-hour rows.
 */
export const getContactAndHours = async (): Promise<ContactAndHours> => {
  try {
    dbLogger.info("Fetching studio contact and business hours", {
      table: "studio_contact",
    });

    const [contactResult, hoursResult] = await Promise.all([
      supabase.from("studio_contact").select("*").limit(1).maybeSingle(),
      supabase
        .from("business_hours")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    if (contactResult.error) {
      dbLogger.error("Failed to fetch studio contact", {
        table: "studio_contact",
        error: contactResult.error,
      });
      throw contactResult.error;
    }

    if (hoursResult.error) {
      dbLogger.error("Failed to fetch business hours", {
        table: "business_hours",
        error: hoursResult.error,
      });
      throw hoursResult.error;
    }

    const contact = contactResult.data
      ? validateStudioContact(contactResult.data)
      : null;
    const hours =
      hoursResult.data?.map((row) => validateBusinessHour(row)) || [];

    dbLogger.info("Successfully fetched studio contact and hours", {
      table: "studio_contact",
      data: { hasContact: Boolean(contact), hoursCount: hours.length },
    });

    return { contact, hours };
  } catch (error) {
    dbLogger.error("Error in getContactAndHours", { error });
    throw error;
  }
};

const upsertStudioContact = async (
  contactData: StudioContactCreate & { id?: string },
): Promise<StudioContact> => {
  const validatedData = validateStudioContactCreate({
    phone: contactData.phone,
    email: contactData.email,
    address: contactData.address,
  });

  if (contactData.id) {
    const { data, error } = await supabase
      .from("studio_contact")
      .update(validatedData)
      .eq("id", contactData.id)
      .select()
      .single();

    if (error) throw error;
    return validateStudioContact(data);
  }

  const { data: existing, error: existingError } = await supabase
    .from("studio_contact")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { data, error } = await supabase
      .from("studio_contact")
      .update(validatedData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return validateStudioContact(data);
  }

  const { data, error } = await supabase
    .from("studio_contact")
    .insert([validatedData])
    .select()
    .single();

  if (error) throw error;
  return validateStudioContact(data);
};

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const syncBusinessHours = async (hours: HourRow[]): Promise<HourRow[]> => {
  const { data: existingRows, error: existingError } = await supabase
    .from("business_hours")
    .select("id");

  if (existingError) throw existingError;

  const keepIds = new Set(
    hours
      .map((hour) => hour.id)
      .filter((id) => isUuid(id)),
  );
  const idsToDelete =
    existingRows
      ?.map((row) => row.id as string)
      .filter((id) => !keepIds.has(id)) || [];

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("business_hours")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) throw deleteError;
  }

  if (hours.length === 0) {
    return [];
  }

  const hourPayload = hours.map((hour, index) =>
    validateBusinessHourCreate({
      id: isUuid(hour.id) ? hour.id : crypto.randomUUID(),
      day: hour.day,
      time_label: hour.time,
      sort_order: index,
    }),
  );

  const { data, error } = await supabase
    .from("business_hours")
    .upsert(hourPayload, { onConflict: "id" })
    .select()
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) =>
    mapBusinessHourToHourRow(validateBusinessHour(row)),
  );
};

/**
 * Persist contact fields and the full hours list.
 * Upserts the singleton contact row, upserts hour rows by id,
 * and deletes hour rows that were removed in the admin UI.
 */
export const saveContactAndHours = async ({
  contact,
  hours,
}: SaveContactAndHoursInput): Promise<SavedContactAndHours> => {
  try {
    dbLogger.info("Saving studio contact and business hours", {
      table: "studio_contact",
      data: { hoursCount: hours.length },
    });

    const savedContact = await upsertStudioContact(contact);
    const savedHours = await syncBusinessHours(hours);

    dbLogger.info("Successfully saved studio contact and hours", {
      table: "studio_contact",
      data: { id: savedContact.id, hoursCount: savedHours.length },
    });

    return { contact: savedContact, hours: savedHours };
  } catch (error) {
    dbLogger.error("Error in saveContactAndHours", { error });
    throw error;
  }
};
