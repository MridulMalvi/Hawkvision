/**
 * ProtectedRoute — guards routes that require authentication.
 *
 * Instead of just checking localStorage for a token string (which could be
 * expired), this component calls `useAuth()` to validate the token against
 * the API. Shows a loading state while checking, then redirects on failure.
 */
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getToken } from "../store/auth";
import { useAuth } from "../hooks/useAuth";
import { Spinner } from "./ui/Spinner";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = getToken();
  const { isLoading, isError } = useAuth();

  // No token at all — redirect immediately without an API call
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists but we're validating it against /auth/me
  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner size={32} />
      </div>
    );
  }

  // Token is invalid/expired — API returned 401 which cleared the token
  if (isError) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
