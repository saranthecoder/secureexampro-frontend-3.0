import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from "react";
import { User } from "@/types/exam";

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (
    email: string,
    password: string,
    role: "admin" | "student"
  ) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: "admin" | "student"
  ) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

import BASE_URL from "@/config/api";


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
        if (parsedUser.loginTimestamp && (Date.now() - parsedUser.loginTimestamp < TWELVE_HOURS_MS)) {
          return parsedUser;
        } else {
          localStorage.removeItem("user");
        }
      } catch (err) {
        localStorage.removeItem("user");
      }
    }
    return null;
  });

  // Verify 12-hour expiration on interval
  useEffect(() => {
    if (!user || !user.loginTimestamp) return;
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    const checkExpiry = () => {
      if (Date.now() - user.loginTimestamp! >= TWELVE_HOURS_MS) {
        localStorage.removeItem("user");
        setUser(null);
      }
    };
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // ✅ LOGIN
  const login = useCallback(
    async (
      email: string,
      password: string,
      role: "admin" | "student"
    ): Promise<boolean> => {
      try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) return false;

        // Role validation
        if (data.user.role !== role) return false;

        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    []
  );

  // ✅ SIGNUP
  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: "admin" | "student"
    ): Promise<boolean> => {
      try {
        const res = await fetch(`${BASE_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role })
        });

        const data = await res.json();

        if (!res.ok) return false;

        // Auto-login after signup
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        signup,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
