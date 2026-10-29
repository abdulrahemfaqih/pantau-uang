import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DriverOrderFormValues } from "@/lib/validations";

export function useDriverOrder() {
  const queryClient = useQueryClient();

  const createDriverOrderMutation = useMutation({
    mutationFn: async (data: DriverOrderFormValues) => {
      const res = await fetch("/api/transactions/driver-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal menyimpan order driver");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  return {
    createDriverOrder: createDriverOrderMutation.mutateAsync,
    isSubmitting: createDriverOrderMutation.isPending,
  };
}
