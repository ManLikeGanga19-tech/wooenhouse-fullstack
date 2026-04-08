import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AdminContactsParams } from "@/lib/api/client";
import { toast } from "sonner";

export const contactKeys = {
  all:    ["contacts"] as const,
  list:   (params?: AdminContactsParams) => [...contactKeys.all, "list", params] as const,
  detail: (id: string) => [...contactKeys.all, "detail", id] as const,
};

export function useContacts(params?: AdminContactsParams) {
  return useQuery({
    queryKey:  contactKeys.list(params),
    queryFn:   () => api.admin.contacts.getAll(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn:  () => api.admin.contacts.getById(id).then((r) => r.data),
    enabled:  !!id,
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.admin.contacts.update(id, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      toast.success("Contact updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.contacts.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      toast.success("Contact deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
