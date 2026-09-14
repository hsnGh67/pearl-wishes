import { FormEvent, ReactNode, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE_ID,
  toE164,
} from "../../lib/constants/country-codes";
import { signInWithPhonePassword } from "../../lib/auth/phone-auth";
import { resolvePanelStaff } from "../../lib/auth/panel-staff";
import { useAuth } from "../../hooks/useAuth";
import { PhoneAuthForm } from "./PhoneAuthForm";

type AdminLoginMode = "password" | "otp";

interface AdminLoginFormProps {
  redirectTo: string;
}

function GradientSubmitButton({
  disabled,
  children,
  type = "button",
}: {
  disabled?: boolean;
  children: ReactNode;
  type?: "button" | "submit";
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

export function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [mode, setMode] = useState<AdminLoginMode>("password");
  const [countryCodeId, setCountryCodeId] = useState(
    DEFAULT_COUNTRY_CODE_ID,
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!phoneNumber.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const phone = toE164(countryCodeId, phoneNumber);
      const { session } = await signInWithPhonePassword(phone, password);

      if (!session?.user) {
        throw new Error("Sign in succeeded but no session was created.");
      }

      const staff = await resolvePanelStaff(session.user);
      await refreshProfile();

      if (!staff.canAccessAdmin) {
        navigate("/", { replace: true });
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid phone number or password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "otp") {
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <PhoneAuthForm
          variant="page"
          title="Admin sign in"
          description="Enter your phone number to receive a verification code"
          submitLabel="Sign in"
          redirectTo={redirectTo}
        />
        <p className="text-center text-sm text-gray-500">
          <button
            type="button"
            className="underline-offset-2 hover:underline"
            style={{ color: "#3D3935" }}
            onClick={() => {
              setMode("password");
              setError(null);
            }}
          >
            Sign in with password
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-[#DCD4CD] bg-[#FEFCFA] p-8 shadow-sm">
      <div className="space-y-1 pb-4">
        <h2
          className="text-2xl font-semibold"
          style={{ color: "#3D3935" }}
        >
          Admin sign in
        </h2>
        <p className="text-sm text-gray-500">
          Enter your phone number and password
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handlePasswordSubmit} className="space-y-6 py-2">
        <div className="space-y-2">
          <Label htmlFor="admin-phone">Phone Number</Label>
          <div className="flex gap-2">
            <Select
              value={countryCodeId}
              onValueChange={setCountryCodeId}
            >
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
              id="admin-phone"
              type="tel"
              placeholder="7XXX XXXXXX"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(
                  e.target.value.replace(/[^0-9\s\-()]/g, ""),
                )
              }
              className="flex-1"
              required
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <GradientSubmitButton
          disabled={
            isSubmitting || !phoneNumber.trim() || !password
          }
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </GradientSubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        <button
          type="button"
          className="underline-offset-2 hover:underline"
          style={{ color: "#3D3935" }}
          onClick={() => {
            setMode("otp");
            setError(null);
          }}
        >
          Sign in with SMS code
        </button>
      </p>
    </div>
  );
}
