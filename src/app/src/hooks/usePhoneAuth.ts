import { useCallback, useState } from "react";
import { sendPhoneOtp, verifyPhoneOtp } from "../lib/auth/phone-auth";
import { syncProfile } from "../lib/auth/profile-sync";
import {
  DEFAULT_COUNTRY_CODE_ID,
  toE164,
} from "../lib/constants/country-codes";
import { User } from "../schema/user.schema";

export type PhoneAuthStep = "phone" | "otp";

export type PhoneAuthStatus =
  | "idle"
  | "sending"
  | "awaitingOtp"
  | "verifying"
  | "success"
  | "error";

interface UsePhoneAuthOptions {
  defaultCountryCode?: string;
  defaultPhone?: string;
  onSuccess?: (profile: User) => void;
}

export function usePhoneAuth(options: UsePhoneAuthOptions = {}) {
  const { onSuccess } = options;
  const [step, setStep] = useState<PhoneAuthStep>("phone");
  const [status, setStatus] = useState<PhoneAuthStatus>("idle");
  const [countryCodeId, setCountryCodeId] = useState(
    options.defaultCountryCode ?? DEFAULT_COUNTRY_CODE_ID,
  );
  const [phoneNumber, setPhoneNumber] = useState(options.defaultPhone ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [e164Phone, setE164Phone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep("phone");
    setStatus("idle");
    setOtpCode("");
    setE164Phone("");
    setError(null);
  }, []);

  const sendOtp = useCallback(async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    setError(null);
    setStatus("sending");

    try {
      const phone = toE164(countryCodeId, phoneNumber);
      await sendPhoneOtp(phone);
      setE164Phone(phone);
      setStep("otp");
      setStatus("awaitingOtp");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Failed to send verification code.",
      );
    }
  }, [countryCodeId, phoneNumber]);

  const verifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError(null);
    setStatus("verifying");

    try {
      const { session } = await verifyPhoneOtp(e164Phone, otpCode);

      if (!session?.user) {
        throw new Error("Verification succeeded but no session was created.");
      }

      const profile = await syncProfile(session.user);
      setStatus("success");
      onSuccess?.(profile);
      return profile;
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Invalid verification code.",
      );
      return null;
    }
  }, [e164Phone, otpCode, onSuccess]);

  const resendOtp = useCallback(async () => {
    setOtpCode("");
    await sendOtp();
  }, [sendOtp]);

  return {
    step,
    status,
    countryCodeId,
    phoneNumber,
    otpCode,
    e164Phone,
    error,
    isSending: status === "sending",
    isVerifying: status === "verifying",
    setCountryCodeId,
    setPhoneNumber,
    setOtpCode,
    sendOtp,
    verifyOtp,
    resendOtp,
    reset,
    goBackToPhone: () => {
      setStep("phone");
      setOtpCode("");
      setError(null);
      setStatus("idle");
    },
  };
}
