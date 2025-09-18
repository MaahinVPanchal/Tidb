import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "@/types";
import { apiRequest } from "@/lib/api";

interface LoginPayload {
  passid?: string;
  name?: string;
  password: string;
}

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
    }
  }, [token]);

  const login = async (payload: LoginPayload) => {
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const { access_token, user } = response;
      localStorage.setItem("access_token", access_token);
      setToken(access_token);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error("Login failed");
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Backend returns RegisterResponse { passid: str }
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      const { passid } = response as { passid?: string };
      if (!passid) {
        // Registration succeeded but no passid returned — treat as success but do not auto-login
        return;
      }

      // Auto-login using returned passid and the password user just provided
      await login({ passid, password });
    } catch (error) {
      throw new Error("Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
