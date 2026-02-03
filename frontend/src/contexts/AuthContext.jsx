import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const response = await fetch(
        "http://localhost:3002/api/v2/auth/me",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.authenticated) {
        setUser({
          ...data.user,
          avatarVersion: Date.now(),
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
    await fetch("http://localhost:3002/api/v2/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    fetchMe();
  }, []);

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
