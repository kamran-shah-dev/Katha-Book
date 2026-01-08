import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-8">Checking session...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
