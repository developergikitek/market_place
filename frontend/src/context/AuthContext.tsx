"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, getCurrentUser, logoutUser } from "@/services/authService";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      console.error("[AuthProvider] Failed to fetch current user:", err);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("[AuthProvider] Error logging out:", err);
    } finally {
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
