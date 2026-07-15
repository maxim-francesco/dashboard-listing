import { useQuery } from "@tanstack/react-query";
import { getMessageCounts } from "@/services/api";

export const useActionNeededCount = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["message-counts"],
    queryFn: getMessageCounts,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    actionNeeded: data?.actionNeeded ?? 0,
    isLoading,
  };
};
