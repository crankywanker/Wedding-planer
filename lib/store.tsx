"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { emptyProfile, type CategoryState, type ChatMessage, type Guest, type Profile } from "./schemas";

export type PlanState = {
  profile: Profile;
  messages: ChatMessage[];
  interviewComplete: boolean;
  categories: Record<string, CategoryState>;
  guests: Guest[];
  contingencyPct: number;
};

const initialState: PlanState = {
  profile: emptyProfile,
  messages: [],
  interviewComplete: false,
  categories: {},
  guests: [],
  contingencyPct: 10,
};

const STORAGE_KEY = "wedding-planner:v1";

type Store = {
  state: PlanState;
  update: (fn: (s: PlanState) => PlanState) => void;
  updateCategory: (key: string, fn: (c: CategoryState) => CategoryState) => void;
  reset: () => void;
  loaded: boolean;
};

const StoreContext = createContext<Store | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlanState>(initialState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...initialState, ...JSON.parse(saved) });
    } catch {
      // Storage unavailable or corrupt: start fresh.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota / private-mode errors; the plan still works in memory.
    }
  }, [state, loaded]);

  const store: Store = {
    state,
    loaded,
    update: (fn) => setState(fn),
    updateCategory: (key, fn) =>
      setState((s) => {
        const current = s.categories[key] ?? { options: [], shortlist: [], favorite: null, addOns: {} };
        return { ...s, categories: { ...s.categories, [key]: fn(current) } };
      }),
    reset: () => setState(initialState),
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function usePlan(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("usePlan must be used inside PlanProvider");
  return store;
}
