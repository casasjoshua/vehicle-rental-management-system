
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../../../services/authService";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
