import { useQuery } from "@tanstack/react-query";
import type { UserWithPermissions } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<UserWithPermissions>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isViewer: user?.role === "viewer",
  };
}