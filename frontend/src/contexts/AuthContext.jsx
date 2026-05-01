import { createContext, useContext, useEffect, useState } from "react";
import {
  getUserProfile,
  loginUser,
  registerUser,
  updateUserProfile
} from "../api/auth";

const AuthContext = createContext(null);
const storageKey = "cog-report-session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapSession = async () => {
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(stored);
        const response = await getUserProfile(parsedUser.id);
        setUser(response.data.user);
        localStorage.setItem(storageKey, JSON.stringify(response.data.user));
      } catch (error) {
        localStorage.removeItem(storageKey);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapSession();
  }, []);

  const saveSession = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(storageKey, JSON.stringify(nextUser));
  };

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem(storageKey);
  };

  const login = async (payload) => {
    const response = await loginUser(payload);
    saveSession(response.data.user);
    return response;
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    saveSession(response.data.user);
    return response;
  };

  const refreshProfile = async () => {
    if (!user?.id) {
      return null;
    }

    const response = await getUserProfile(user.id);
    saveSession(response.data.user);
    return response.data.user;
  };

  const updateProfile = async (payload) => {
    const response = await updateUserProfile(user.id, payload);
    saveSession(response.data.user);
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout: clearSession,
        refreshProfile,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
