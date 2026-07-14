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
): Promise<Service> => {
  try {
    // Validate input
    const validatedData = validateServiceUpdate(serviceData);

    dbLogger.info("Updating service", {
      table: "services",
      data: { id: validatedData.id },
    });

    const { id, ...updateFields } = validatedData;

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