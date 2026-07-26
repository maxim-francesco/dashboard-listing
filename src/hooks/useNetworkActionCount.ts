import { useQuery } from "@tanstack/react-query";
import { getNetworkSummary, NetworkSummary } from "@/services/api";

export const useNetworkActionCount = () => {
  const { data, isLoading } = useQuery<NetworkSummary>({
    queryKey: ["network-summary"],
    queryFn: getNetworkSummary,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return { count: data?.actionItems?.length ?? 0, isLoading };
};
