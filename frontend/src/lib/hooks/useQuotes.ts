import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AdminQuotesParams, type Quote } from "@/lib/api/client";
import { toast } from "sonner";

export const quoteKeys = {
  all:    ["quotes"] as const,
  list:   (params?: AdminQuotesParams) => [...quoteKeys.all, "list", params] as const,
  detail: (id: string) => [...quoteKeys.all, "detail", id] as const,
};

export function useQuotes(params?: AdminQuotesParams) {
  return useQuery({
    queryKey:  quoteKeys.list(params),
    queryFn:   () => api.admin.quotes.getAll(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn:  () => api.admin.quotes.getById(id).then((r) => r.data),
    enabled:  !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Quote>) => api.admin.quotes.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quoteKeys.all });
      toast.success("Quote created.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Quote> }) =>
      api.admin.quotes.update(id, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: quoteKeys.all });
      qc.invalidateQueries({ queryKey: quoteKeys.detail(updated.id) });
      toast.success("Quote updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSendQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.quotes.send(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quoteKeys.all });
      toast.success("Quote sent to customer.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.quotes.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quoteKeys.all });
      toast.success("Quote deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
