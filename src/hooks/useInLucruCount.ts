import { useQuery } from "@tanstack/react-query";
import { getCustomers, CustomerListItem } from "@/services/api";

export const isInLucru = (c: CustomerListItem): boolean =>
  Boolean(c.activeReservation || c.pendingOffer || c.nextAppointment);

export const useInLucruCount = () => {
  const { data, isLoading } = useQuery<CustomerListItem[]>({
    queryKey: ["customers"],
    queryFn: getCustomers,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return {
    inLucru: (data ?? []).filter(isInLucru).length,
    isLoading,
  };
};
