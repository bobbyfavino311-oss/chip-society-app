import React, { createContext, useContext } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import { useMutation, useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";

const REVENUECAT_TEST_API_KEY    = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY     = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

// ─── Chip bundle metadata ─────────────────────────────────────────────────────
// Maps RevenueCat product identifier → chip count and display label.
// Must stay in sync with seedRevenueCat.ts CHIP_BUNDLES.

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

// ─── Ticket bundle metadata ───────────────────────────────────────────────────
// Maps RevenueCat product identifier → scratch ticket count and display label.
// Must stay in sync with seedRevenueCat.ts TICKET_BUNDLES.

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

// ─── Initialization ───────────────────────────────────────────────────────────

function getRevenueCatApiKey(): string | null {
  if (__DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient") {
    return REVENUECAT_TEST_API_KEY ?? null;
  }
  if (Platform.OS === "ios")     return REVENUECAT_IOS_API_KEY ?? null;
  if (Platform.OS === "android") return REVENUECAT_ANDROID_API_KEY ?? null;
  return REVENUECAT_TEST_API_KEY ?? null;
}

export function initializeRevenueCat() {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn("[RevenueCat] API key not configured — in-app purchases disabled");
    return;
  }
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  console.log("[RevenueCat] configured");
}

// ─── Context ──────────────────────────────────────────────────────────────────

function useSubscriptionContext() {
  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn:  () => Purchases.getOfferings(),
    staleTime: 5 * 60 * 1000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: any) => {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: () => offeringsQuery.refetch(),
  });

  const restoreMutation = useMutation({
    mutationFn: () => Purchases.restorePurchases(),
  });

  return {
    offerings:   offeringsQuery.data,
    isLoading:   offeringsQuery.isLoading,
    purchase:    purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error as Error | null,
    restore:      restoreMutation.mutateAsync,
    isRestoring:  restoreMutation.isPending,
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return ctx;
}
