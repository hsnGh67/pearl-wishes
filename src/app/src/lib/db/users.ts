import { supabase } from "../../config/supabase";
import {
  User,
  UserCreate,
  UserUpdate,
  Note,
  NoteSchema,
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
      .select(
        "*, user_notes(*), bookings!bookings_user_id_fkey(*), workshop_bookings(*, workshops(title, price))",
      )
      .order("created_at", { ascending: false });

    if (error) {
      dbLogger.error("Failed to fetch users", {
        table: "users",
        error,
      });
      throw error;
    }

    console.log("📦 Raw users from Supabase:", data?.slice(0, 2)); // Show first 2 users

    const validatedUsers =
      data?.map((user) => {
        const { user_notes, workshop_bookings, ...rest } =
          user as any;
        const validated = validateUser({
          ...rest,
          notes: user_notes ?? [],
          bookings: user.bookings ?? [],
          workshops: workshop_bookings ?? user.workshops ?? [],
        });
        console.log("✅ Validated user:", {
          name: validated.full_name,
          hasAddress: !!validated.address,
          address: validated.address,
          postcode: validated.postcode,
          district: validated.district,
          notesCount: validated.notes?.length ?? 0,
          bookingsCount: validated.bookings?.length ?? 0,
          workshopsCount: validated.workshops?.length ?? 0,
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

    console.log("📦 Raw users from Supabase:", data?.slice(0, 2)); // Show first 2 users

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
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
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

    const validatedUsers = data?.map((user) => validateUser(user)) || [];

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
export const getUserById = async (id: string): Promise<User | null> => {
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
export const getUserByEmail = async (email: string): Promise<User | null> => {
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
export const createUser = async (userData: UserCreate): Promise<User> => {
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
export const updateUser = async (userData: UserUpdate): Promise<User> => {
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

    const { error } = await supabase.from("users").delete().eq("id", id);

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
export const getUserByPhone = async (phone: string): Promise<User | null> => {
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

/**
 * Add a note to a user
 */
export const addUserNote = async (
  userId: string,
  content: string,
  author = "Admin",
): Promise<Note> => {
  try {
    dbLogger.info("Adding note to user", {
      table: "user_notes",
      data: { userId },
    });

    const { data, error } = await supabase
      .from("user_notes")
      .insert([{ user_id: userId, content, author }])
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to add user note", {
        table: "user_notes",
        error,
      });
      throw error;
    }

    const validatedNote = NoteSchema.parse(data);

    dbLogger.info("Successfully added user note", {
      table: "user_notes",
      data: { id: validatedNote.id },
    });

    return validatedNote;
  } catch (error) {
    dbLogger.error("Error in addUserNote", { error });
    throw error;
  }
};

/**
 * Update a user note's content
 */
export const updateUserNote = async (
  noteId: string,
  content: string,
): Promise<Note> => {
  try {
    dbLogger.info("Updating user note", {
      table: "user_notes",
      data: { noteId },
    });

    const { data, error } = await supabase
      .from("user_notes")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .select()
      .single();

    if (error) {
      dbLogger.error("Failed to update user note", {
        table: "user_notes",
        error,
      });
      throw error;
    }

    const validatedNote = NoteSchema.parse(data);

    dbLogger.info("Successfully updated user note", {
      table: "user_notes",
      data: { id: validatedNote.id },
    });

    return validatedNote;
  } catch (error) {
    dbLogger.error("Error in updateUserNote", { error });
    throw error;
  }
};

/**
 * Delete a user note
 */
export const deleteUserNote = async (noteId: string): Promise<void> => {
  try {
    dbLogger.info("Deleting user note", {
      table: "user_notes",
      data: { noteId },
    });

    const { error } = await supabase
      .from("user_notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      dbLogger.error("Failed to delete user note", {
        table: "user_notes",
        error,
      });
      throw error;
    }

    dbLogger.info("Successfully deleted user note", {
      table: "user_notes",
      data: { noteId },
    });
  } catch (error) {
    dbLogger.error("Error in deleteUserNote", { error });
    throw error;
  }
};
