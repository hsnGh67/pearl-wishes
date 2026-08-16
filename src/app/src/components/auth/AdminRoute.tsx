import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export function AdminRoute() {
  const { isLoading, isAuthenticated, isAdmin, profile } = useAuth();
  const location = useLocation();

  if (isLoading || (isAuthenticated && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FEFCFA]">
        <p style={{ color: "#3D3935" }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
