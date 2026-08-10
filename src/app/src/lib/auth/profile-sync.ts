import type { User as AuthUser } from "@supabase/supabase-js";
import {
  createUser,
  getUserByAuthId,
  getUserByPhone,
  linkAuthId,
} from "../db/users";
import { normalizePhone } from "../constants/country-codes";
import { User, UserRole } from "../../schema/user.schema";

export async function syncProfile(authUser: AuthUser): Promise<User> {
  const authId = authUser.id;
  const phone = authUser.phone ? normalizePhone(authUser.phone) : undefined;

  const existingByAuth = await getUserByAuthId(authId);
  if (existingByAuth) {
    return existingByAuth;
  }

  if (phone) {
    const existingByPhone = await getUserByPhone(phone);
    if (existingByPhone) {
      if (existingByPhone.auth_id && existingByPhone.auth_id !== authId) {
        throw new Error("This phone number is linked to another account.");
      }
      if (!existingByPhone.auth_id) {
        return await linkAuthId(existingByPhone.id!, authId);
      }
      return existingByPhone;
    }
  }

  return await createUser({
    auth_id: authId,
    phone,
    full_name: "User",
    role: UserRole.CLIENT,
  });
}

export function parseAddressFromProfile(address?: string | null): {
  houseNumber: string;
  street: string;
} {
  if (!address) {
    return { houseNumber: "", street: "" };
  }

  const addressParts = address.split(",");
  if (addressParts.length >= 1) {
    const streetPart = addressParts[0].trim();
    const match = streetPart.match(/^(\d+)\s+(.+)$/);
    if (match) {
      return { houseNumber: match[1], street: match[2] };
    }
  }

  return { houseNumber: "", street: address };
}
