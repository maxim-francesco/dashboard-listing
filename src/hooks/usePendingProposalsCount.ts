import { useQuery } from "@tanstack/react-query";
import { getPendingProposalsCount } from "@/services/api";

export const usePendingProposalsCount = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["pending-proposals-count"],
    queryFn: getPendingProposalsCount,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  });

  return {
    count: data?.count ?? 0,
    isLoading,
  };
};
