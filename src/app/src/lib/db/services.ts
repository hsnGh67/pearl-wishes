import { supabase } from "../../config/supabase";
import {
  Service,
  ServiceCreate,
  ServiceUpdate,
  validateService,
  validateServiceCreate,
  validateServiceUpdate,
  ServiceCategory,
  CategoryCreate,
  Category,
  validateCategory,
  validateCreateCategory,
} from "../../schema/service.schema";
import { dbLogger } from "./logger";
import { uploadImageAndGetUrl } from "../../utils/uploadImageAndGetUrl";

/**
 * Get all services
 */
export const getAllServices = async (): Promise<Service[]> => {
  try {
    dbLogger.info("Fetching all services", {
      table: "services",
    });

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      dbLogger.error("Failed to fetch services", {
        table: "services",
        error,
      });
      throw error;
    }

    // Validate each service against schema
    const validatedServices =
      data?.map((service) => validateService(service)) || [];

    dbLogger.info("Successfully fetched services", {
      table: "services",
      data: { count: validatedServices.length },
    });

    return validatedServices;
  } catch (error) {
    dbLogger.error("Error in getAllServices", { error });
    throw error;
  }
};

/**
 * Get active services only
 */
export const getActiveServices = async (): Promise<
  Service[]
> => {
  try {
    dbLogger.info("Fetching active services", {
      table: "services",
    });

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      dbLogger.error("Failed to fetch active services", {
        table: "services",
        error,
      });
      throw error;
    }

    const validatedServices =
      data?.map((service) => validateService(service)) || [];

    dbLogger.info("Successfully fetched active services", {
      table: "services",
      data: { count: validatedServices.length },
    });

    return validatedServices;
  } catch (error) {
    dbLogger.error("Error in getActiveServices", { error });
    throw error;
  }
};

/**
 * Get services by category
 */
export const getServicesByCategory = async (
  category: ServiceCategory,
): Promise<Service[]> => {
  try {
    dbLogger.info("Fetching services by category", {
      table: "services",
      data: { category },
    });

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      dbLogger.error("Failed to fetch services by category", {
        table: "services",
        error,
      });
      throw error;
    }

    const validatedServices =
      data?.map((service) => validateService(service)) || [];

    dbLogger.info("Successfully fetched services by category", {
      table: "services",
      data: { category, count: validatedServices.length },
    });

    return validatedServices;
  } catch (error) {
    dbLogger.error("Error in getServicesByCategory", { error });
    throw error;
  }
};

/**
 * Get service by ID
 */
export const getServiceById = async (
  id: string,
): Promise<Service | null> => {
  try {
    dbLogger.info("Fetching service by ID", {
      table: "services",
      data: { id },
    });

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      dbLogger.error("Failed to fetch service by ID", {
        table: "services",
        error,
      });
      throw error;
    }

    if (!data) {
      dbLogger.warn("Service not found", {
        table: "services",
        data: { id },
      });
      return null;
    }

    const validatedService = validateService(data);

    dbLogger.info("Successfully fetched service", {
      table: "services",
      data: { id: validatedService.id },
    });

    return validatedService;
  } catch (error) {
    dbLogger.error("Error in getServiceById", { error });
    throw error;
  }
};

/**
 * Get all active categories
 */
export const getActiveCategories = async (): Promise<
  Category[]
> => {
  try {
    dbLogger.info("Fetching active categories", {
      table: "categories",
    });

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch active categories", {
        table: "categories",
        error,
      });
      throw error;
    }

    const validatedCategories =
      data?.map((category) => validateCategory(category)) || [];

    dbLogger.info("Successfully fetched active categories", {
      table: "categories",
      data: { count: validatedCategories.length },
    });

    return validatedCategories;
  } catch (error) {
    dbLogger.error("Error in getActiveCategories", { error });
    throw error;
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    dbLogger.info("Fetching all categories", { table: "categories" });
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      dbLogger.error("Failed to fetch all categories", { table: "categories", error });
      throw error;
    }
    return data?.map((c) => validateCategory(c)) || [];
  } catch (error) {
    dbLogger.error("Error in getAllCategories", { error });
    throw error;
  }
};

export const updateCategoryStatus = async (
  id: string,
  is_active: boolean,
): Promise<Category> => {
  try {
    dbLogger.info("Updating category status", { table: "categories", data: { id, is_active } });
    const { data, error } = await supabase
      .from("categories")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      dbLogger.error("Failed to update category status", { table: "categories", error });
      throw error;
    }
    return validateCategory(data);
  } catch (error) {
    dbLogger.error("Error in updateCategoryStatus", { error });
    throw error;
  }
};

export const deleteCategoryById = async (id: string): Promise<void> => {
  try {
    dbLogger.info("Deleting category", { table: "categories", data: { id } });
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);
    if (error) {
      dbLogger.error("Failed to delete category", { table: "categories", error });
      throw error;
    }
    dbLogger.info("Successfully deleted category", { table: "categories", data: { id } });
  } catch (error) {
    dbLogger.error("Error in deleteCategoryById", { error });
    throw error;
  }
};

export const getServiceCountByCategory = async (categoryId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId);
    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    dbLogger.error("Error in getServiceCountByCategory", { error });
    throw error;
  }
};

export const createCategory = async (
  categoryData: CategoryCreate,
): Promise<Category> => {
  try {
    // Validate input
    const validatedData = validateCreateCategory(categoryData);

    dbLogger.info("Creating new category", {
      table: "categories",
      data: validatedData,
    });

    const { data, error } = await supabase
      .from("categories")
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to create category", {
        table: "categories",
        error,
      });
      throw error;
    }

    const validatedCategory = validateCategory(data);

    dbLogger.info("Successfully created category", {
      table: "categories",
      data: { id: validatedCategory.id },
    });

    return validatedCategory;
  } catch (error) {
    dbLogger.error("Error in createCategory", { error });
    throw error;
  }
};
/**
 * Create a new service
 */
export const createService = async (
  serviceData: ServiceCreate,
): Promise<Service> => {
  try {
    // Validate input
    const validatedData = validateServiceCreate(serviceData);

    dbLogger.info("Creating new service", {
      table: "services",
      data: validatedData,
    });

    const { data, error } = await supabase
      .from("services")
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to create service", {
        table: "services",
        error,
      });
      throw error;
    }

    const validatedService = validateService(data);

    dbLogger.info("Successfully created service", {
      table: "services",
      data: { id: validatedService.id },
    });

    return validatedService;
  } catch (error) {
    dbLogger.error("Error in createService", { error });
    throw error;
  }
};

/**
 * Update an existing service
 */
export const updateService = async (
  serviceData: ServiceUpdate,
  imageFile?: File | null,
): Promise<Service> => {
  try {
    // Validate input
    const validatedData = validateServiceUpdate(serviceData);

    dbLogger.info("Updating service", {
      table: "services",
      data: { id: validatedData.id },
    });

    const { id, ...updateFields } = validatedData;

    if (imageFile) {
      const image_url = await uploadImageAndGetUrl(
        imageFile,
        "services",
      );
      if (image_url) {
        updateFields.image_url = image_url;
      }
    }

    const { data, error } = await supabase
      .from("services")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to update service", {
        table: "services",
        error,
      });
      throw error;
    }

    const validatedService = validateService(data);

    dbLogger.info("Successfully updated service", {
      table: "services",
      data: { id: validatedService.id },
    });

    return validatedService;
  } catch (error) {
    dbLogger.error("Error in updateService", { error });
    throw error;
  }
};

/**
 * Delete a service
 */
export const deleteService = async (
  id: string,
): Promise<void> => {
  try {
    dbLogger.info("Deleting service", {
      table: "services",
      data: { id },
    });

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      dbLogger.error("Failed to delete service", {
        table: "services",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully deleted service", {
      table: "services",
      data: { id },
    });
  } catch (error) {
    dbLogger.error("Error in deleteService", { error });
    throw error;
  }
};

/**
 * Get add-on service IDs mapped to a specific service
 */
export const getServiceAddonIds = async (
  serviceId: string,
): Promise<string[]> => {
  const { data, error } = await supabase
    .from("service_addons")
    .select("addon_id")
    .eq("service_id", serviceId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    dbLogger.error("Error in getServiceAddonIds", { error });
    throw error;
  }
  return data?.map((r) => r.addon_id) ?? [];
};

/**
 * Atomically replace all add-on mappings for a service.
 * Passing an empty array clears all mappings.
 */
export const syncServiceAddons = async (
  serviceId: string,
  addonIds: string[],
): Promise<void> => {
  const deduped = [...new Set(addonIds)];

  if (deduped.includes(serviceId)) {
    throw new Error("A service cannot reference itself as an add-on");
  }

  // Delegates to the sync_service_addons DB function (migration 008).
  // The function runs delete + insert in a single transaction, validates
  // that all IDs are active is_add_on services, and rolls back on any failure.
  const { error } = await supabase.rpc("sync_service_addons", {
    p_service_id: serviceId,
    p_addon_ids: deduped,
  });

  if (error) {
    dbLogger.error("Error in syncServiceAddons", { error });
    throw error;
  }
};

/**
 * Fetch a flat mapping of serviceId → addonId[] for all active services.
 * Used in the booking flow to preload conditional add-on routing data.
 */
export const getServiceAddonMappings = async (): Promise<
  Record<string, string[]>
> => {
  const { data, error } = await supabase
    .from("service_addons")
    .select("service_id, addon_id")
    .eq("is_active", true);

  if (error) {
    dbLogger.error("Error in getServiceAddonMappings", { error });
    throw error;
  }

  const mapping: Record<string, string[]> = {};
  data?.forEach(({ service_id, addon_id }) => {
    if (!mapping[service_id]) mapping[service_id] = [];
    mapping[service_id].push(addon_id);
  });
  return mapping;
};

/**
 * Toggle service active status
 */
export const toggleServiceStatus = async (
  id: string,
  isActive: boolean,
): Promise<Service> => {
  try {
    dbLogger.info("Toggling service status", {
      table: "services",
      data: { id, isActive },
    });

    const { data, error } = await supabase
      .from("services")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to toggle service status", {
        table: "services",
        error,
      });
      throw error;
    }

    const validatedService = validateService(data);

    dbLogger.info("Successfully toggled service status", {
      table: "services",
      data: {
        id: validatedService.id,
        is_active: validatedService.is_active,
      },
    });

    return validatedService;
  } catch (error) {
    dbLogger.error("Error in toggleServiceStatus", { error });
    throw error;
  }
};