import { useSearchParams } from "react-router";
import { PhoneAuthForm } from "../components/auth/PhoneAuthForm";

export function Login() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("from") ?? "/";

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#FEFCFA" }}
    >
      <PhoneAuthForm
        variant="page"
        title="Sign in"
        description="Enter your phone number to continue"
        submitLabel="Sign in"
        redirectTo={redirectTo}
      />
    </div>
  );
}