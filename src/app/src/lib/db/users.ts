import { supabase } from "../../config/supabase";
import {
  User,
  UserCreate,
  UserUpdate,
  validateUser,
  validateUserCreate,
  validateUserUpdate,
  UserRole,
} from "../../schema/user.schema";
import { dbLogger } from "./logger";

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    dbLogger.info("Fetching all users", { table: "users" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch users", {
        table: "users",
        error,
      });
      throw error;
    }

    console.log(
      "📦 Raw users from Supabase:",
      data?.slice(0, 2),
    ); // Show first 2 users

    const validatedUsers =
      data?.map((user) => {
        const validated = validateUser(user);
        console.log("✅ Validated user:", {
          name: validated.full_name,
          hasAddress: !!validated.address,
          address: validated.address,
          postcode: validated.postcode,
          district: validated.district,
        });
        return validated;
      }) || [];

    dbLogger.info("Successfully fetched users", {
      table: "users",
      data: { count: validatedUsers.length },
    });

    return validatedUsers;
  } catch (error) {
    dbLogger.error("Error in getAllUsers", { error });
    throw error;
  }
};

/**
 * Get all users
 */
export const findUserByNameOrEmailOrPhone = async (
  searchQuery: string,
): Promise<User[]> => {
  try {
    dbLogger.info("findUserByNameOrEmailOrPhone", {
      table: "users",
    });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(
        `full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
      );

    if (error) {
      dbLogger.error("Failed to fetch users", {
        table: "users",
        error,
      });
      throw error;
    }

    console.log(
      "📦 Raw users from Supabase:",
      data?.slice(0, 2),
    ); // Show first 2 users

    const validatedUsers =
      data?.map((user) => {
        const validated = validateUser(user);
        console.log("✅ Validated user:", {
          name: validated.full_name,
          hasAddress: !!validated.address,
          address: validated.address,
          district: validated.district,
        });
        return validated;
      }) || [];

    dbLogger.info("Successfully fetched users", {
      table: "users",
      data: { count: validatedUsers.length },
    });

    return validatedUsers;
  } catch (error) {
    dbLogger.error("Error in getAllUsers", { error });
    throw error;
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (
  role: UserRole,
): Promise<User[]> => {
  try {
    dbLogger.info("Fetching users by role", {
      table: "users",
      data: { role },
    });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", role)
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch users by role", {
        table: "users",
        error,
      });
      throw error;
    }

    const validatedUsers =
      data?.map((user) => validateUser(user)) || [];

    dbLogger.info("Successfully fetched users by role", {
      table: "users",
      data: { role, count: validatedUsers.length },
    });

    return validatedUsers;
  } catch (error) {
    dbLogger.error("Error in getUsersByRole", { error });
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (
  id: string,
): Promise<User | null> => {
  try {
    dbLogger.info("Fetching user by ID", {
      table: "users",
      data: { id },
    });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      dbLogger.error("Failed to fetch user by ID", {
        table: "users",
        error,
      });
      throw error;
    }

    if (!data) {
      dbLogger.warn("User not found", {
        table: "users",
        data: { id },
      });
      return null;
    }

    const validatedUser = validateUser(data);

    dbLogger.info("Successfully fetched user", {
      table: "users",
      data: { id: validatedUser.id },
    });

    return validatedUser;
  } catch (error) {
    dbLogger.error("Error in getUserById", { error });
    throw error;
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (
  email: string,
): Promise<User | null> => {
  try {
    dbLogger.info("Fetching user by email", {
      table: "users",
      data: { email },
    });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      dbLogger.error("Failed to fetch user by email", {
        table: "users",
        error,
      });
      throw error;
    }

    if (!data) {
      dbLogger.warn("User not found", {
        table: "users",
        data: { email },
      });
      return null;
    }

    const validatedUser = validateUser(data);

    dbLogger.info("Successfully fetched user", {
      table: "users",
      data: { id: validatedUser.id },
    });

    return validatedUser;
  } catch (error) {
    dbLogger.error("Error in getUserByEmail", { error });
    throw error;
  }
};

/**
 * Create a new user
 */
export const createUser = async (
  userData: UserCreate,
): Promise<User> => {
  try {
    const validatedData = validateUserCreate(userData);

    console.log("userData ===>", userData);
    dbLogger.info("Creating new user", {
      table: "users",
      data: { email: validatedData.email },
    });

    const { data, error } = await supabase
      .from("users")
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to create user", {
        table: "users",
        error,
      });
      throw error;
    }

    const validatedUser = validateUser(data);

    dbLogger.info("Successfully created user", {
      table: "users",
      data: { id: validatedUser.id },
    });

    return validatedUser;
  } catch (error) {
    dbLogger.error("Error in createUser", { error });
    throw error;
  }
};

/**
 * Update an existing user
 */
export const updateUser = async (
  userData: UserUpdate,
): Promise<User> => {
  try {
    const validatedData = validateUserUpdate(userData);

    dbLogger.info("Updating user", {
      table: "users",
      data: { id: validatedData.id },
    });

    const { id, ...updateFields } = validatedData;

    const { data, error } = await supabase
      .from("users")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to update user", {
        table: "users",
        error,
      });
      throw error;
    }

    const validatedUser = validateUser(data);

    dbLogger.info("Successfully updated user", {
      table: "users",
      data: { id: validatedUser.id },
    });

    return validatedUser;
  } catch (error) {
    dbLogger.error("Error in updateUser", { error });
    throw error;
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string): Promise<void> => {
  try {
    dbLogger.info("Deleting user", {
      table: "users",
      data: { id },
    });

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) {
      dbLogger.error("Failed to delete user", {
        table: "users",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully deleted user", {
      table: "users",
      data: { id },
    });
  } catch (error) {
    dbLogger.error("Error in deleteUser", { error });
    throw error;
  }
};

/**
 * Get user by phone number
 */
export const getUserByPhone = async (
  phone: string,
): Promise<User | null> => {
  try {
    dbLogger.info("Fetching user by phone", {
      table: "users",
      data: { phone },
    });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (error) {
      // No user found is not an error, just return null
      if (error.code === "PGRST116") {
        dbLogger.info("User not found by phone", {
          table: "users",
          data: { phone },
        });
        return null;
      }
      dbLogger.error("Failed to fetch user by phone", {
        table: "users",
        error,
      });
      throw error;
    }

    if (!data) {
      dbLogger.info("User not found by phone", {
        table: "users",
        data: { phone },
      });
      return null;
    }

    const validatedUser = data;

    dbLogger.info("Successfully fetched user by phone", {
      table: "users",
      data: { id: validatedUser.id },
    });

    return validatedUser;
  } catch (error) {
    dbLogger.error("Error in getUserByPhone", { error });
    return null; // Return null instead of throwing to allow fallback to user creation
  }
};