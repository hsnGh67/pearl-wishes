import { supabase } from "../../config/supabase";
import {
  DistrictPostcode,
  validateDistrictPostcode,
} from "../../schema/district-postcode.schema";
import { getPostcodeOutwardCode } from "../utils";
import { dbLogger } from "./logger";

export const getActiveDistrictPostcodes = async (): Promise<
  DistrictPostcode[]
> => {
  try {
    dbLogger.info("Fetching active district postcodes", {
      table: "districts_postcodes",
    });
    const { data, error } = await supabase
      .from("districts_postcodes")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return (
      data?.map((row) => validateDistrictPostcode(row)) || []
    );
  } catch (error) {
    dbLogger.error("Error in getActiveDistrictPostcodes", {
      error,
    });
    throw error;
  }
};

/**
 * Returns true if the postcode's UK outward code matches any
 * active service-area prefix in districts_postcodes.
 */
export const isPostcodeInServiceArea = async (
  postcode: string,
): Promise<boolean> => {
  const outward = getPostcodeOutwardCode(postcode);
  if (!outward) return false;

  const rows = await getActiveDistrictPostcodes();
  const prefixes = rows.flatMap((row) =>
    row.postcode_prefixes.map((p) => p.trim().toUpperCase()),
  );

  return prefixes.includes(outward);
};