import { supabase } from "../../config/supabase";

export async function sendPhoneOtp(
  phone: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    throw error;
  }
}

export async function verifyPhoneOtp(
  phone: string,
  token: string,
) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithPhonePassword(
  phone: string,
  password: string,
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      phone,
      password,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAuthPassword(
  password: string,
): Promise<void> {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}