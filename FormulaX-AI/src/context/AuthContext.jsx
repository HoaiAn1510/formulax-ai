import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("formulax_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("formulax_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("formulax_user");
    }
  }, [user]);

  const login = (userInfo) => {
    setUser({
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      googleId: userInfo.sub,
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
