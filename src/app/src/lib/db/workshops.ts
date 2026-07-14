/**
 * Workshops Database Operations
 * All CRUD operations for workshops table
 */

import { supabase } from "../../config/supabase";
import {
  Workshop,
  WorkshopInput,
  formatWorkshopForDatabase,
} from "../../schema/workshop.schema";

/**
 * Get all workshops
 */
export async function getAllWorkshops(): Promise<Workshop[]> {
  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching workshops:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get active workshops only
 */
export async function getActiveWorkshops(): Promise<
  Workshop[]
> {
  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching active workshops:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get workshop by ID
 */
export async function getWorkshopById(
  id: string,
): Promise<Workshop | null> {
  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching workshop:", error);
    throw error;
  }

  return data;
}

/**
 * Create a new workshop
 */
export async function createWorkshop(
  input: WorkshopInput,
): Promise<Workshop> {
  const workshopData = formatWorkshopForDatabase(input);
  console.log("input ===>", input);
  console.log("createWorkshop ===>", workshopData);
  const { data, error } = await supabase
    .from("workshops")
    .insert([workshopData])
    .select()
    .single();

  if (error) {
    console.error("Error creating workshop:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing workshop
 */
export async function updateWorkshop(
  id: string,
  input: Partial<WorkshopInput>,
): Promise<Workshop> {
  const { data, error } = await supabase
    .from("workshops")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating workshop:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a workshop
 */
export async function deleteWorkshop(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("workshops")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting workshop:", error);
    throw error;
  }
}

/**
 * Toggle workshop active status
 */
export async function toggleWorkshopStatus(
  id: string,
  is_active: boolean,
): Promise<Workshop> {
  return updateWorkshop(id, { is_active });
}