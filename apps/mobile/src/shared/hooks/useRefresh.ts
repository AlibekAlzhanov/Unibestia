import { useCallback, useState } from "react";

type RefreshHandler = () => Promise<unknown> | unknown;

export function useRefresh(handler: RefreshHandler) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      await handler();
    } finally {
      setRefreshing(false);
    }
  }, [handler, refreshing]);

  return {
    refreshing,
    onRefresh,
  };
}
