import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo, useState } from "react";

export type StaffHistoryStatus =
  | "validated"
  | "confirmed"
  | "cancelled"
  | "failed";

export type StaffHistoryItem = {
  id: string;
  qrTokenMasked: string;
  status: StaffHistoryStatus;
  title: string;
  subtitle?: string | null;
  createdAt: string;
};

type StaffHistoryContextValue = {
  items: StaffHistoryItem[];
  addItem: (item: Omit<StaffHistoryItem, "id" | "createdAt">) => void;
  clear: () => void;
};

const StaffHistoryContext = createContext<StaffHistoryContextValue | null>(null);

export function StaffHistoryProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<StaffHistoryItem[]>([]);

  const value = useMemo<StaffHistoryContextValue>(
    () => ({
      items,
      addItem(item) {
        setItems((current) =>
          [
            {
              ...item,
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              createdAt: new Date().toISOString(),
            },
            ...current,
          ].slice(0, 20)
        );
      },
      clear() {
        setItems([]);
      },
    }),
    [items]
  );

  return (
    <StaffHistoryContext.Provider value={value}>
      {children}
    </StaffHistoryContext.Provider>
  );
}

export function useStaffHistory() {
  const context = useContext(StaffHistoryContext);

  if (!context) {
    throw new Error("useStaffHistory must be used inside StaffHistoryProvider");
  }

  return context;
}
