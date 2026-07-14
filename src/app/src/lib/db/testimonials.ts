import { supabase } from "../../config/supabase";
import {
  Testimonial,
  TestimonialCreate,
  TestimonialUpdate,
  validateTestimonial,
  validateTestimonialCreate,
  validateTestimonialUpdate,
} from "../../schema/testimonial.schema";
import { dbLogger } from "./logger";

/**
 * Get all testimonials
 */
export const getAllTestimonials = async (): Promise<
  Testimonial[]
> => {
  try {
    dbLogger.info("Fetching all testimonials", {
      table: "testimonials",
    });

    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch testimonials", {
        table: "testimonials",
        error,
      });
      throw error;
    }

    const validatedTestimonials =
      data?.map((testimonial) =>
        validateTestimonial(testimonial),
      ) || [];

    dbLogger.info("Successfully fetched testimonials", {
      table: "testimonials",
      data: { count: validatedTestimonials.length },
    });

    return validatedTestimonials;
  } catch (error) {
    dbLogger.error("Error in getAllTestimonials", { error });
    throw error;
  }
};

/**
 * Get published testimonials only
 */
export const getPublishedTestimonials = async (): Promise<
  Testimonial[]
> => {
  try {
    dbLogger.info("Fetching published testimonials", {
      table: "testimonials",
    });

    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch published testimonials", {
        table: "testimonials",
        error,
      });
      throw error;
    }

    const validatedTestimonials =
      data?.map((testimonial) =>
        validateTestimonial(testimonial),
      ) || [];

    dbLogger.info(
      "Successfully fetched published testimonials",
      {
        table: "testimonials",
        data: { count: validatedTestimonials.length },
      },
    );

    return validatedTestimonials;
  } catch (error) {
    dbLogger.error("Error in getPublishedTestimonials", {
      error,
    });
    throw error;
  }
};

/**
 * Get featured testimonials
 */
export const getFeaturedTestimonials = async (): Promise<
  Testimonial[]
> => {
  try {
    dbLogger.info("Fetching featured testimonials", {
      table: "testimonials",
    });

    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_featured", true)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch featured testimonials", {
        table: "testimonials",
        error,
      });
      throw error;
    }

    const validatedTestimonials =
      data?.map((testimonial) =>
        validateTestimonial(testimonial),
      ) || [];

    dbLogger.info(
      "Successfully fetched featured testimonials",
      {
        table: "testimonials",
        data: { count: validatedTestimonials.length },
      },
    );

    return validatedTestimonials;
  } catch (error) {
    dbLogger.error("Error in getFeaturedTestimonials", {
      error,
    });
    throw error;
  }
};

/**
 * Get testimonial by ID
 */
export const getTestimonialById = async (
  id: string,
): Promise<Testimonial | null> => {
  try {
    dbLogger.info("Fetching testimonial by ID", {
      table: "testimonials",
      data: { id },
    });

    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      dbLogger.error("Failed to fetch testimonial by ID", {
        table: "testimonials",
        error,
      });
      throw error;
    }

    if (!data) {
      dbLogger.warn("Testimonial not found", {
        table: "testimonials",
        data: { id },
      });
      return null;
    }

    const validatedTestimonial = validateTestimonial(data);

    dbLogger.info("Successfully fetched testimonial", {
      table: "testimonials",
      data: { id: validatedTestimonial.id },
    });

    return validatedTestimonial;
  } catch (error) {
    dbLogger.error("Error in getTestimonialById", { error });
    throw error;
  }
};

/**
 * Create a new testimonial
 */
export const createTestimonial = async (
  testimonialData: TestimonialCreate,
): Promise<Testimonial> => {
  try {
    const validatedData =
      validateTestimonialCreate(testimonialData);

    dbLogger.info("Creating new testimonial", {
      table: "testimonials",
      data: validatedData,
    });

    const { data, error } = await supabase
      .from("testimonials")
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to create testimonial", {
        table: "testimonials",
        error,
      });
      throw error;
    }

    const validatedTestimonial = validateTestimonial(data);

    dbLogger.info("Successfully created testimonial", {
      table: "testimonials",
      data: { id: validatedTestimonial.id },
    });

    return validatedTestimonial;
  } catch (error) {
    dbLogger.error("Error in createTestimonial", { error });
    throw error;
  }
};

/**
 * Update an existing testimonial
 */
export const updateTestimonial = async (
  testimonialData: TestimonialUpdate,
): Promise<Testimonial> => {
  try {
    const validatedData =
      validateTestimonialUpdate(testimonialData);

    dbLogger.info("Updating testimonial", {
      table: "testimonials",
      data: { id: validatedData.id },
    });

    const { id, ...updateFields } = validatedData;

    const { data, error } = await supabase
      .from("testimonials")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to update testimonial", {
        table: "testimonials",
        error,
      });
      throw error;
    }

    const validatedTestimonial = validateTestimonial(data);

    dbLogger.info("Successfully updated testimonial", {
      table: "testimonials",
      data: { id: validatedTestimonial.id },
    });

    return validatedTestimonial;
  } catch (error) {
    dbLogger.error("Error in updateTestimonial", { error });
    throw error;
  }
};

/**
 * Delete a testimonial
 */
export const deleteTestimonial = async (
  id: string,
): Promise<boolean> => {
  try {
    dbLogger.info("Deleting testimonial", {
      table: "testimonials",
      data: { id },
    });

    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) {
      dbLogger.error("Failed to delete testimonial", {
        table: "testimonials",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully deleted testimonial", {
      table: "testimonials",
      data: { id },
    });

    return true;
  } catch (error) {
    dbLogger.error("Error in deleteTestimonial", { error });
    throw error;
  }
};

/**
 * Toggle testimonial published status
 */
export const toggleTestimonialPublished = async (
  id: string,
  isPublished: boolean,
): Promise<Testimonial> => {
  try {
    dbLogger.info("Toggling testimonial published status", {
      table: "testimonials",
      data: { id, isPublished },
    });

    const { data, error } = await supabase
      .from("testimonials")
      .update({ is_published: isPublished })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      dbLogger.error(
        "Failed to toggle testimonial published status",
        {
          table: "testimonials",
          error,
        },
      );
      throw error;
    }

    const validatedTestimonial = validateTestimonial(data);

    dbLogger.info(
      "Successfully toggled testimonial published status",
      {
        table: "testimonials",
        data: {
          id: validatedTestimonial.id,
          is_published: validatedTestimonial.is_published,
        },
      },
    );

    return validatedTestimonial;
  } catch (error) {
    dbLogger.error("Error in toggleTestimonialPublished", {
      error,
    });
    throw error;
  }
};