import { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Separator } from "../../../components/ui/separator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../../../components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { COUNTRY_CODES } from "../../lib/constants/country-codes";
import { usePhoneAuth } from "../../hooks/usePhoneAuth";
import { useAuth } from "../../hooks/useAuth";
import { User, UserRole } from "../../schema/user.schema";

interface PhoneAuthFormProps {
  variant?: "page" | "embedded" | "dialog";
  title?: string;
  description?: string;
  submitLabel?: string;
  defaultCountryCode?: string;
  defaultPhone?: string;
  onSuccess?: (profile: User) => void;
  redirectTo?: string;
  className?: string;
}

function GradientSubmitButton({
  disabled,
  children,
  type = "button",
  onClick,
}: {
  disabled?: boolean;
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  const isActive = !disabled;

  return (
    <Button
      type={type}
      className="w-full transition-all"
      style={{
        backgroundColor: isActive ? "#3D3935" : "#DCD4CD",
        background: isActive ? "#3D3935" : "#DCD4CD",
        color: isActive ? "transparent" : "#3D3935",
        cursor: isActive ? "pointer" : "not-allowed",
      }}
      onMouseEnter={(e) => {
        if (isActive) {
          e.currentTarget.style.backgroundColor = "#1F1F1F";
          e.currentTarget.style.background = "#1F1F1F";
        }
      }}
      onMouseLeave={(e) => {
        if (isActive) {
          e.currentTarget.style.backgroundColor = "#3D3935";
          e.currentTarget.style.background = "#3D3935";
        }
      }}
      disabled={disabled}
      onClick={onClick}
    >
      {isActive ? (
        <span
          style={{
            background: "linear-gradient(to right, #FCEAE0, #EACAB8)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}

export function PhoneAuthForm({
  variant = "embedded",
  title = "Phone Verification",
  description = "Enter your phone number to get started",
  submitLabel = "Continue",
  defaultCountryCode,
  defaultPhone,
  onSuccess,
  redirectTo,
  className,
}: PhoneAuthFormProps) {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleSuccess = async (profile: User) => {
    await refreshProfile();
    onSuccess?.(profile);

    if (redirectTo) {
      const isAdminTarget = redirectTo.startsWith("/admin");
      if (isAdminTarget && profile.role !== UserRole.ADMIN) {
        navigate("/", { replace: true });
        return;
      }
      navigate(redirectTo, { replace: true });
    }
  };

  const {
    step,
    countryCodeId,
    phoneNumber,
    otpCode,
    error,
    isSending,
    isVerifying,
    setCountryCodeId,
    setPhoneNumber,
    setOtpCode,
    sendOtp,
    verifyOtp,
    resendOtp,
    goBackToPhone,
  } = usePhoneAuth({
    defaultCountryCode,
    defaultPhone,
    onSuccess: handleSuccess,
  });

  const handlePhoneSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendOtp();
  };

  const handleOtpSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await verifyOtp();
  };

  const wrapperClass =
    variant === "page"
      ? "mx-auto w-full max-w-md rounded-lg border border-[#DCD4CD] bg-[#FEFCFA] p-8 shadow-sm"
      : "";

  return (
    <div className={`${wrapperClass} ${className ?? ""}`.trim()}>
      <div className="space-y-1 pb-4">
        <h2
          className={
            variant === "page" ? "text-2xl font-semibold" : "text-lg font-semibold"
          }
          style={{ color: "#3D3935" }}
        >
          {title}
        </h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-6 py-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Select value={countryCodeId} onValueChange={setCountryCodeId}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.code} {item.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                placeholder="7XXX XXXXXX"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/[^0-9\s\-()]/g, ""))
                }
                className="flex-1"
                required
              />
            </div>
            <p className="text-sm text-gray-500">
              We&apos;ll send you a verification code via SMS
            </p>
          </div>

          <GradientSubmitButton disabled={isSending || !phoneNumber.trim()} type="submit">
            {isSending ? "Sending code..." : "Send verification code"}
          </GradientSubmitButton>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-6 py-2">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Enter the 6-digit code sent to your phone
            </p>
          </div>

          <Separator />

          <GradientSubmitButton
            disabled={isVerifying || otpCode.length !== 6}
            type="submit"
          >
            {isVerifying ? "Verifying..." : submitLabel}
          </GradientSubmitButton>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-gray-600 underline-offset-2 hover:underline"
              onClick={goBackToPhone}
            >
              Change phone number
            </button>
            <button
              type="button"
              className="text-gray-600 underline-offset-2 hover:underline"
              onClick={resendOtp}
              disabled={isSending}
            >
              {isSending ? "Resending..." : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
