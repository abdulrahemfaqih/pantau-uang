import { QueryClient } from "@tanstack/react-query";

export function prefetchPageData(queryClient: QueryClient, href: string) {
  try {
    if (href === "/") {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      queryClient.prefetchQuery({
        queryKey: ["dashboard-summary", month, year],
        queryFn: async () => {
          const res = await fetch(`/api/analytics?month=${month}&year=${year}`);
          if (!res.ok) throw new Error("Prefetch failed");
          return res.json();
        },
      });
    } else if (href === "/transactions") {
      queryClient.prefetchQuery({
        queryKey: ["transactions", {}],
        queryFn: async () => {
          const res = await fetch("/api/transactions");
          if (!res.ok) throw new Error("Prefetch failed");
          return res.json();
        },
      });
    } else if (href === "/accounts") {
      queryClient.prefetchQuery({
        queryKey: ["accounts"],
        queryFn: async () => {
          const res = await fetch("/api/accounts");
          if (!res.ok) throw new Error("Prefetch failed");
          return res.json();
        },
      });
    } else if (href === "/categories") {
      queryClient.prefetchQuery({
        queryKey: ["categories"],
        queryFn: async () => {
          const res = await fetch("/api/categories");
          if (!res.ok) throw new Error("Prefetch failed");
          return res.json();
        },
      });
    } else if (href === "/debts") {
      queryClient.prefetchQuery({
        queryKey: ["debts"],
        queryFn: async () => {
          const res = await fetch("/api/debts");
          if (!res.ok) throw new Error("Prefetch failed");
          return res.json();
        },
      });
    } else if (href === "/recurring") {
      queryClient.prefetchQuery({
        queryKey: ["recurring"],
        queryFn: async () => {
          const res = await fetch("/api/recurring");
          if (!res.ok) throw new Error("Prefetch failed");
          return res.json();
        },
      });
    } else if (href === "/statistics") {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      queryClient.prefetchQuery({
        queryKey: ["statistics", "daily", year, month],
        queryFn: async () => {
          const res = await fetch(`/api/statistics?type=daily&month=${month}&year=${year}`);
          if (!res.ok) throw new Error("Prefetch failed");
          return res.json();
        },
      });
    }
  } catch {
    // Silent catch on background prefetch
  }
}
