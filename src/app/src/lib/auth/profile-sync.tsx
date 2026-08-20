import type { User as AuthUser } from "@supabase/supabase-js";
import {
  createUser,
  getUserByAuthId,
  getUserByPhone,
  linkAuthId,
  updateUser,
} from "../db/users";
import { normalizePhone } from "../constants/country-codes";
import { User, UserRole } from "../../schema/user.schema";

const PLACEHOLDER_FULL_NAME = "User";
const PHONE_SHAPED_NAME = /^\+?\d[\d\s\-()]{6,}$/;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function isPlaceholderFullName(
  fullName?: string | null,
  phone?: string | null,
): boolean {
  const name = fullName?.trim() ?? "";
  if (!name) {
    return true;
  }

  if (
    name.toLowerCase() === PLACEHOLDER_FULL_NAME.toLowerCase()
  ) {
    return true;
  }

  if (PHONE_SHAPED_NAME.test(name)) {
    return true;
  }

  if (phone) {
    const nameDigits = digitsOnly(name);
    const phoneDigits = digitsOnly(phone);
    if (
      nameDigits &&
      phoneDigits &&
      nameDigits === phoneDigits
    ) {
      return true;
    }
  }

  return false;
}

async function normalizePlaceholderName(
  user: User,
  fallbackPhone?: string,
): Promise<User> {
  const phone = user.phone || fallbackPhone;
  if (!isPlaceholderFullName(user.full_name, phone)) {
    return user;
  }

  const normalized: User = {
    ...user,
    full_name: PLACEHOLDER_FULL_NAME,
  };

  // Persist cleanup when the DB still stores a phone-shaped name
  if (
    user.id &&
    user.full_name.trim().toLowerCase() !==
      PLACEHOLDER_FULL_NAME.toLowerCase()
  ) {
    try {
      return await updateUser({
        id: user.id,
        full_name: PLACEHOLDER_FULL_NAME,
      });
    } catch {
      return normalized;
    }
  }

  return normalized;
}

export async function syncProfile(
  authUser: AuthUser,
): Promise<User> {
  const authId = authUser.id;
  const phone = authUser.phone
    ? normalizePhone(authUser.phone)
    : undefined;

  const existingByAuth = await getUserByAuthId(authId);
  if (existingByAuth) {
    return await normalizePlaceholderName(
      existingByAuth,
      phone,
    );
  }

  if (phone) {
    const existingByPhone = await getUserByPhone(phone);
    console.log("existingByPhone", existingByPhone);
    if (existingByPhone) {
      if (
        existingByPhone.auth_id &&
        existingByPhone.auth_id !== authId
      ) {
        throw new Error(
          "This phone number is linked to another account.",
        );
      }
      if (!existingByPhone.auth_id) {
        const linked = await linkAuthId(
          existingByPhone.id!,
          authId,
        );
        return await normalizePlaceholderName(linked, phone);
      }
      return await normalizePlaceholderName(
        existingByPhone,
        phone,
      );
    }
  }

  return await createUser({
    auth_id: authId,
    phone,
    full_name: PLACEHOLDER_FULL_NAME,
    role: UserRole.CLIENT,
  });
}

export function parseAddressFromProfile(
  address?: string | null,
): {
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