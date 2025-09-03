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
  const { data, isLoading, error } = useQuery<AuthResponse | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    // Don't refetch on window focus to avoid unnecessary requests
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      
      // Handle 401 as a successful "not authenticated" state
      if (res.status === 401) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
  });

  return {
    user: data?.advisor,
    isLoading,
    isAuthenticated: !!data?.advisor,
    error,
  };
}