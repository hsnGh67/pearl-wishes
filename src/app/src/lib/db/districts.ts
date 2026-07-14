import { supabase } from "../../config/supabase";
import {
  District,
  DistrictCreate,
  DistrictUpdate,
  validateDistrict,
  validateDistrictCreate,
  validateDistrictUpdate,
} from "../../schema/district.schema";
import { dbLogger } from "./logger";

export const getAllDistricts = async (): Promise<{
  available: District[];
  comingSoon: District[];
}> => {
  try {
    dbLogger.info("Fetching all districts", {
      table: "districts",
    });
    const { data, error } = await supabase
      .from("districts")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    const validatedDistricts =
      data?.map((district) => validateDistrict(district)) || [];
    return {
      available: validatedDistricts.filter(
        (d) => !d.is_coming_soon,
      ),
      comingSoon: validatedDistricts.filter(
        (d) => d.is_coming_soon,
      ),
    };
  } catch (error) {
    dbLogger.error("Error in getAllDistricts", { error });
    throw error;
  }
};

export const getActiveDistricts = async (): Promise<
  District[]
> => {
  try {
    dbLogger.info("Fetching active districts", {
      table: "districts",
    });
    const { data, error } = await supabase
      .from("districts")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw error;
    return (
      data?.map((district) => validateDistrict(district)) || []
    );
  } catch (error) {
    dbLogger.error("Error in getActiveDistricts", { error });
    throw error;
  }
};

export const getDistrictById = async (
  id: string,
): Promise<District | null> => {
  try {
    dbLogger.info("Fetching district by ID", {
      table: "districts",
      data: { id },
    });
    const { data, error } = await supabase
      .from("districts")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data ? validateDistrict(data) : null;
  } catch (error) {
    dbLogger.error("Error in getDistrictById", { error });
    throw error;
  }
};

export const createDistrict = async (
  districtData: DistrictCreate,
): Promise<District> => {
  try {
    const validatedData = validateDistrictCreate(districtData);
    dbLogger.info("Creating new district", {
      table: "districts",
      data: validatedData,
    });
    const { data, error } = await supabase
      .from("districts")
      .insert([validatedData])
      .select()
      .single();
    if (error) throw error;
    return validateDistrict(data);
  } catch (error) {
    dbLogger.error("Error in createDistrict", { error });
    throw error;
  }
};

export const updateDistrict = async (
  districtData: DistrictUpdate,
): Promise<District> => {
  try {
    const validatedData = validateDistrictUpdate(districtData);
    dbLogger.info("Updating district", {
      table: "districts",
      data: { id: validatedData.id },
    });
    const { id, ...updateFields } = validatedData;
    const { data, error } = await supabase
      .from("districts")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return validateDistrict(data);
  } catch (error) {
    dbLogger.error("Error in updateDistrict", { error });
    throw error;
  }
};

export const deleteDistrict = async (
  id: string,
): Promise<void> => {
  try {
    dbLogger.info("Deleting district", {
      table: "districts",
      data: { id },
    });
    const { error } = await supabase
      .from("districts")
      .delete()
      .eq("id", id);
    if (error) throw error;
  } catch (error) {
    dbLogger.error("Error in deleteDistrict", { error });
    throw error;
  }
};