/**
 * useAuth — fetches and caches the current authenticated user.
 * Returns undefined when no token is present.
 */
import { useQuery } from "@tanstack/react-query";
import { me } from "../services/auth";
import { getToken } from "../store/auth";
import { queryKeys } from "../services/queryKeys";

export function useAuth() {
  const token = getToken();
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: me,
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000, // 1 minute — user data rarely changes
  });
}
