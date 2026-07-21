import { useQuery } from "@tanstack/react-query";
import { getConversationsUnreadCount } from "@/services/api";

export const useConversationsUnreadCount = () => {
  const { data } = useQuery({
    queryKey: ["conversations-unread-count"],
    queryFn: getConversationsUnreadCount,
    staleTime: 20000,
    refetchOnWindowFocus: true,
  });

  return {
    count: data?.count ?? 0,
  };
};
