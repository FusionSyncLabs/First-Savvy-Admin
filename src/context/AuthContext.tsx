"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type User = {
  id: string;
  email: string;
  fullName: string;
  role?: string;
  accessToken: string;
  refreshToken: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "http://localhost:5000/api/v1/auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem("admin_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("admin_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || errorData.error || `Login failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Temporary: Role check removed
      // TODO: Add role check when backend provides role in response
      const membershipRole = data.profile?.membershipRole || "owner";
      
      const userData: User = {
        id: data.user?.id || "",
        email: data.user?.email || email,
        fullName: data.user?.full_name || "",
        role: membershipRole,
        accessToken: data.session?.accessToken || data.accessToken,
        refreshToken: data.session?.refreshToken || data.refreshToken,
      };

      setUser(userData);
      localStorage.setItem("admin_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("admin_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
