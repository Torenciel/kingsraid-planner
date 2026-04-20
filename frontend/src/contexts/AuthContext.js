import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const data = await api.request("/v2/auth/me");

      if (data.authenticated) {
        setUser({
          ...data.user,
          id: data.user._id || data.user.id,
          avatarVersion: Date.now(),
          bannerVersion: Date.now(),
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.request("/v2/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      // Even if logout request fails, clear local state
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!user?.preferences?.theme) return;

    document.documentElement.setAttribute(
      "data-theme",
      user.preferences.theme
    );
  }, [user?.preferences?.theme]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        refetchAuth: fetchMe,
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