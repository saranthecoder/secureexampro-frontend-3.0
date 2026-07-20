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
  const [user, setUser] = useState<User | null>(null);

  // 🔥 Restore session from localStorage on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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
