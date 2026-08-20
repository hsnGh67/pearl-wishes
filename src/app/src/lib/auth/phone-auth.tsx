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