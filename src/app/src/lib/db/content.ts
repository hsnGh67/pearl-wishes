import { supabase } from "../../config/supabase";
import {
  ContentSection,
  ContentSectionCreate,
  ContentSectionUpdate,
  validateContentSection,
  validateContentSectionCreate,
  validateContentSectionUpdate,
} from "../../schema/content.schema";
import { dbLogger } from "./logger";

/**
 * Get all content sections
 */
export const getAllContentSections = async (): Promise<
  ContentSection[]
> => {
  try {
    dbLogger.info("Fetching all content sections", {
      table: "content_sections",
    });

    const { data, error } = await supabase
      .from("content_sections")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      dbLogger.error("Failed to fetch content sections", {
        table: "content_sections",
        error,
      });
      throw error;
    }

    const validatedSections =
      data?.map((section) => validateContentSection(section)) ||
      [];

    dbLogger.info("Successfully fetched content sections", {
      table: "content_sections",
      data: { count: validatedSections.length },
    });

    return validatedSections;
  } catch (error) {
    dbLogger.error("Error in getAllContentSections", { error });
    throw error;
  }
};

/**
 * Get content section by name
 */
export const getContentSectionByName = async (
  sectionName: string,
): Promise<ContentSection | null> => {
  try {
    dbLogger.info("Fetching content section by name", {
      table: "content_sections",
      data: { sectionName },
    });

    const { data, error } = await supabase
      .from("content_sections")
      .select("*")
      .eq("section_name", sectionName);

    if (error) {
      dbLogger.error(
        "Failed to fetch content section by name",
        {
          table: "content_sections",
          error,
        },
      );
      throw error;
    }

    if (!data) {
      dbLogger.warn("Content section not found", {
        table: "content_sections",
        data: { sectionName },
      });
      return null;
    }

    dbLogger.info("Successfully fetched content section", {
      table: "content_sections",
      data: { id: data.id },
    });

    return data.sort((a, b) => a.position - b.position);
  } catch (error) {
    dbLogger.error("Error in getContentSectionByName", {
      error,
    });
    throw error;
  }
};

export const updateHeroPosition = async (
  heros: { id: string; position: number }[],
) => {
  try {
    dbLogger.info("Updating Hero positions", {
      table: "content_sections",
      data: { count: heros.length },
    });

    const updatedHeros = await Promise.all(
      heros.map(async ({ id, position }) => {
        const { data, error } = await supabase
          .from("content_sections")
          .update({ position })
          .eq("id", id)
          .select();

        if (error) {
          dbLogger.error("Failed to update hero position", {
            table: "content_sections",
            data: { id, position },
            error,
          });
          throw error;
        }

        return data?.[0] ?? null;
      }),
    );

    dbLogger.info("Successfully updated hero positions", {
      table: "content_sections",
      data: { count: updatedHeros.length },
    });

    return updatedHeros;
  } catch (error) {
    dbLogger.error("Error in updateHeroPosition", { error });
    throw error;
  }
};

export const deleteHeroSectionImage = async (
  id: string,
): Promise<ContentSection | null> => {
  try {
    dbLogger.info("Deleting hero image", {
      table: "content_sections",
      data: { id },
    });

    const { error } = await supabase
      .from("content_sections")
      .delete()
      .eq("id", id);

    if (error) {
      dbLogger.error("Failed to delete content_sections", {
        table: "content_sections",
        error,
      });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in delete deleteHeroSectionImage", {
      error,
    });
    throw error;
  }
};

/**
 * Get content section by name
 */
export const getlookbooks =
  async (): Promise<ContentSection | null> => {
    try {
      dbLogger.info("Fetching getlookbooks", {
        table: "lookbook_images",
      });

      const { data, error } = await supabase
        .from("lookbook_images")
        .select("*")
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (error) {
        dbLogger.error("Failed to fetch Lookbooks", {
          table: "lookbooks_images",
          error,
        });
        throw error;
      }

      if (!data) {
        dbLogger.warn("LookBooks not found", {
          table: "lookbooks_images",
        });
        return null;
      }

      dbLogger.info("Successfully fetched Lookbooks", {
        table: "lookbooks_images",
        data: { id: data.id },
      });

      return data;
    } catch (error) {
      dbLogger.error("Error in getContentSectionByName", {
        error,
      });
      throw error;
    }
  };

export const deleteLookbook = async (
  lookbookId: string,
): Promise<ContentSection | null> => {
  try {
    dbLogger.info("Deleting lookbook", {
      table: "lookbook_images",
      data: { lookbookId },
    });

    const { error } = await supabase
      .from("lookbook_images")
      .delete()
      .eq("id", lookbookId);

    if (error) {
      dbLogger.error("Failed to delete lookbook", {
        table: "lookbooks_images",
        error,
      });
      throw error;
    }
  } catch (error) {
    dbLogger.error("Error in getContentSectionByName", {
      error,
    });
    throw error;
  }
};

export const updateLookbooksPosition = async (
  lookbooks: { id: string; position: number }[],
) => {
  try {
    dbLogger.info("Updating lookbook positions", {
      table: "lookbook_images",
      data: { count: lookbooks.length },
    });

    const updatedLookbooks = await Promise.all(
      lookbooks.map(async ({ id, position }) => {
        const { data, error } = await supabase
          .from("lookbook_images")
          .update({ position })
          .eq("id", id)
          .select();

        if (error) {
          dbLogger.error("Failed to update lookbook position", {
            table: "lookbook_images",
            data: { id, position },
            error,
          });
          throw error;
        }

        return data?.[0] ?? null;
      }),
    );

    dbLogger.info("Successfully updated lookbook positions", {
      table: "lookbook_images",
      data: { count: updatedLookbooks.length },
    });

    return updatedLookbooks;
  } catch (error) {
    dbLogger.error("Error in updateLookbooksPosition", {
      error,
    });
    throw error;
  }
};

/**
 * Create a new content section
 */
export const createContentSection = async (
  sectionData: ContentSectionCreate,
): Promise<ContentSection> => {
  try {
    const validatedData =
      validateContentSectionCreate(sectionData);

    dbLogger.info("Creating new content section", {
      table: "content_sections",
      data: validatedData,
    });

    const { data, error } = await supabase
      .from("content_sections")
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to create content section", {
        table: "content_sections",
        error,
      });
      throw error;
    }

    const validatedSection = validateContentSection(data);

    dbLogger.info("Successfully created content section", {
      table: "content_sections",
      data: { id: validatedSection.id },
    });

    return validatedSection;
  } catch (error) {
    dbLogger.error("Error in createContentSection", { error });
    throw error;
  }
};

/**
 * Create a new lookbook section
 */
export const createLookbookSection = async (lookbookData: {
  title: string;
  description: string;
  image_url: string;
  position: number;
  aspect_ratio: string;
  is_active: boolean;
}): Promise<ContentSection> => {
  try {
    dbLogger.info("Creating new lookbook section", {
      table: "content_sections",
      data: lookbookData,
    });

    const { data, error } = await supabase
      .from("lookbook_images")
      .insert([lookbookData])
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to create content section", {
        table: "content_sections",
        error,
      });
      throw error;
    }

    const validatedSection = data;

    dbLogger.info("Successfully created content section", {
      table: "content_sections",
      data: { id: validatedSection.id },
    });

    return validatedSection;
  } catch (error) {
    dbLogger.error("Error in createContentSection", { error });
    throw error;
  }
};

/**
 * Update an existing content section
 */
export const updateContentSection = async (
  sectionName: string,
  sectionData: ContentSectionUpdate,
): Promise<ContentSection> => {
  try {
    const validatedData =
      validateContentSectionUpdate(sectionData);

    dbLogger.info("Updating content section", {
      table: "content_sections",
      data: { id: validatedData.id },
    });

    const { id, ...updateFields } = validatedData;

    const { data, error } = await supabase
      .from("content_sections")
      .update(updateFields)
      .eq("section_name", sectionName)
      .select();

    if (error) {
      dbLogger.error("Failed to update content section", {
        table: "content_sections",
        error,
      });
      throw error;
    }

    return data;
  } catch (error) {
    dbLogger.error("Error in updateContentSection", { error });
    throw error;
  }
};

/**
 * Delete a content section
 */
export const deleteContentSection = async (
  id: string,
): Promise<void> => {
  try {
    dbLogger.info("Deleting content section", {
      table: "content_sections",
      data: { id },
    });

    const { error } = await supabase
      .from("content_sections")
      .delete()
      .eq("id", id);

    if (error) {
      dbLogger.error("Failed to delete content section", {
        table: "content_sections",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully deleted content section", {
      table: "content_sections",
      data: { id },
    });
  } catch (error) {
    dbLogger.error("Error in deleteContentSection", { error });
    throw error;
  }
};