import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useDriverMode() {
  const queryClient = useQueryClient();

  const query = useQuery<{ isDriver: boolean }>({
    queryKey: ["user-driver-mode"],
    queryFn: async () => {
      const res = await fetch("/api/user/driver-mode");
      if (!res.ok) {
        throw new Error("Gagal memuat status mode driver");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 menit
  });

  const mutation = useMutation({
    mutationFn: async (isDriver: boolean) => {
      const res = await fetch("/api/user/driver-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDriver }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal mengubah mode driver");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-driver-mode"], { isDriver: data.isDriver });
    },
  });

  const isDriver = query.data?.isDriver ?? false;

  const toggleDriverMode = async (targetValue?: boolean) => {
    const nextValue = targetValue !== undefined ? targetValue : !isDriver;
    await mutation.mutateAsync(nextValue);
  };

  return {
    isDriver,
    isLoading: query.isLoading,
    isUpdating: mutation.isPending,
    toggleDriverMode,
  };
}
