import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export function AdminRoute() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FEFCFA]">
        <p style={{ color: "#3D3935" }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?from=/admin" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
