import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export const newsletterKeys = {
  all:  ["newsletter"] as const,
  list: (status?: string) => [...newsletterKeys.all, "list", status] as const,
};

export function useNewsletterSubscribers(status?: string) {
  return useQuery({
    queryKey: newsletterKeys.list(status),
    queryFn:  () => api.admin.newsletter.getAll({ status }).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useDeleteSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.newsletter.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: newsletterKeys.all });
      toast.success("Subscriber removed.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
