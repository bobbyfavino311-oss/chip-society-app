// react-native-purchases is temporarily stubbed out.
// The native RNPurchases module requires proper Expo plugin setup to register
// in the iOS binary. Without it the app crashes at startup on import.
// TODO: replace with expo-purchases or add proper plugin configuration.

import React, { createContext, useContext } from "react";

export type ChipBundle = {
  chips:   number;
  label:   string;
  bonus?:  string;
  color:   string;
  glow:    string;
};

export const CHIP_BUNDLE_MAP: Record<string, ChipBundle> = {
  chips_100k:  { chips: 100_000,    label: "Pocket Change", color: "#888",    glow: "#888" },
  chips_500k:  { chips: 500_000,    label: "Stack",         color: "#00d4ff", glow: "#00d4ff" },
  chips_1500k: { chips: 1_500_000,  label: "Buy-In",        bonus: "+10% XP", color: "#bf5fff", glow: "#bf5fff" },
  chips_5m:    { chips: 5_000_000,  label: "High Roller",   bonus: "+15% XP", color: "#ff0090", glow: "#ff0090" },
  chips_15m:   { chips: 15_000_000, label: "Whale",         bonus: "+20% XP", color: "#ffa500", glow: "#ffa500" },
  chips_50m:   { chips: 50_000_000, label: "Shark",         bonus: "+25% XP", color: "#ffd700", glow: "#ffd700" },
};

export type TicketBundle = {
  tickets: number;
  label:   string;
  color:   string;
};

export const TICKET_BUNDLE_MAP: Record<string, TicketBundle> = {
  tickets_3:  { tickets: 3,  label: "3 Tickets",  color: "#00d4ff" },
  tickets_10: { tickets: 10, label: "10 Tickets", color: "#bf5fff" },
  tickets_25: { tickets: 25, label: "25 Tickets", color: "#ffd700" },
};

export function initializeRevenueCat() {
  // no-op until native module is properly configured
}

type SubscriptionContextValue = {
  offerings:     undefined;
  isLoading:     boolean;
  purchase:      (pkg: any) => Promise<never>;
  isPurchasing:  boolean;
  purchaseError: null;
  restore:       () => Promise<never>;
  isRestoring:   boolean;
};

const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value: SubscriptionContextValue = {
    offerings:    undefined,
    isLoading:    false,
    purchase:     async () => { throw new Error("Store not available"); },
    isPurchasing: false,
    purchaseError: null,
    restore:      async () => { throw new Error("Store not available"); },
    isRestoring:  false,
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return ctx;
}
