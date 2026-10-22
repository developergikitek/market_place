"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { fetchPortalBadges, PortalBadges } from "@/services/badgesService";

interface BadgesContextType {
  badges: PortalBadges;
  refreshBadges: () => Promise<void>;
  decrementOrderCount: () => void;
  decrementReturnCount: () => void;
}

const BadgesContext = createContext<BadgesContextType>({
  badges: { orders: 0, returns: 0, bulk_orders: 0 },
  refreshBadges: async () => {},
  decrementOrderCount: () => {},
  decrementReturnCount: () => {},
});

export const PORTAL_BADGES_REFRESH_EVENT = "portal:badges:refresh";

/** Triggers badge refresh from anywhere in the application (e.g. inside handlers or outside React components) */
export function triggerPortalBadgesRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PORTAL_BADGES_REFRESH_EVENT));
  }
}

export function BadgesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [badges, setBadges] = useState<PortalBadges>({ orders: 0, returns: 0, bulk_orders: 0 });
  const isFetchingRef = useRef(false);

  const refreshBadges = useCallback(async () => {
    if (!isAuthenticated || isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      const data = await fetchPortalBadges();
      setBadges(data);
    } catch (err) {
      console.warn("[BadgesProvider] Error refreshing badges:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [isAuthenticated]);

  // Optimistic decrement helpers for immediate 0-delay feedback
  const decrementOrderCount = useCallback(() => {
    setBadges((prev) => ({
      ...prev,
      orders: Math.max(0, prev.orders - 1),
    }));
  }, []);

  const decrementReturnCount = useCallback(() => {
    setBadges((prev) => ({
      ...prev,
      returns: Math.max(0, prev.returns - 1),
    }));
  }, []);

  // 1. Initial fetch when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshBadges();
    }
  }, [isAuthenticated, refreshBadges]);

  // 2. Custom global event listener for cross-component action triggers
  useEffect(() => {
    const handleCustomRefresh = () => {
      refreshBadges();
    };

    window.addEventListener(PORTAL_BADGES_REFRESH_EVENT, handleCustomRefresh);
    return () => {
      window.removeEventListener(PORTAL_BADGES_REFRESH_EVENT, handleCustomRefresh);
    };
  }, [refreshBadges]);

  // 3. Tab focus & visibility change listener (smart revalidation when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshBadges();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshBadges]);

  // 4. Background heartbeat polling (every 60 seconds) for incoming new orders
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshBadges();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshBadges]);

  return (
    <BadgesContext.Provider
      value={{
        badges,
        refreshBadges,
        decrementOrderCount,
        decrementReturnCount,
      }}
    >
      {children}
    </BadgesContext.Provider>
  );
}

export function useBadges() {
  return useContext(BadgesContext);
}
