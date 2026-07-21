import { useQuery } from "@tanstack/react-query";
import { getTransportInterestsCount } from "@/services/api";

export const useTransportInterestsCount = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["transport-interests-count"],
    queryFn: getTransportInterestsCount,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    count: data?.count ?? 0,
    isLoading,
  };
};
