import { useQuery } from "@tanstack/react-query";

type AuthUser = {
  id: string;
  advisorName: string;
  companyName: string;
  email: string;
};

type AuthResponse = {
  advisor: AuthUser;
};

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    retry: false,
    // Don't refetch on window focus to avoid unnecessary requests
    refetchOnWindowFocus: false,
  });

  return {
    user: data?.advisor,
    isLoading,
    isAuthenticated: !!data?.advisor,
    error,
  };
}