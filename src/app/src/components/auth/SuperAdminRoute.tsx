import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";

/** Allows only users with role=ADMIN. Artists are sent back to /admin (their panel). */
export function SuperAdminRoute() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
