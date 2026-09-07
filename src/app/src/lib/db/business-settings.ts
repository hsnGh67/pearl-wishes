import { supabase } from "../../config/supabase";

export interface BusinessSettings {
  id: string;
  travel_buffer_minutes: number;
  previous_travel_buffer_minutes: number;
  buffer_effective_from: string; // YYYY-MM-DD
  updated_at: string;
}

export const getBusinessSettings = async (): Promise<BusinessSettings | null> => {
  const { data, error } = await supabase
    .from("business_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching business settings:", error);
    return null;
  }
  return data;
};

export const updateBusinessSettings = async (
  updates: Pick<BusinessSettings, "travel_buffer_minutes" | "buffer_effective_from">,
): Promise<BusinessSettings> => {
  const { data: existing, error: fetchError } = await supabase
    .from("business_settings")
    .select("id, travel_buffer_minutes")
    .limit(1)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { data, error } = await supabase
      .from("business_settings")
      .update({
        ...updates,
        // Preserve the current value as history before overwriting it
        previous_travel_buffer_minutes: existing.travel_buffer_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Row doesn't exist yet — insert with matching previous value
  const { data, error } = await supabase
    .from("business_settings")
    .insert({
      ...updates,
      previous_travel_buffer_minutes: updates.travel_buffer_minutes,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};
