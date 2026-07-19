// paste your query-client.js content here
import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});