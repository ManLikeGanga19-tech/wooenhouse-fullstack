import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            60_000,      // 1 minute
      gcTime:               5 * 60_000,  // 5 minutes
      refetchOnWindowFocus: false,
      retry:                (failureCount, error) => {
        // Don't retry on auth errors or client errors
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("401") || msg.includes("403") || msg.includes("404"))
            return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
