import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // AuthContext.jsx - Login w register khass y-returni user
const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  const token = res.data.token || res.data.access_token;
  const userData = res.data.user;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(userData));
  setUser(userData);

  return userData; // ⭐ HADI KHASSEK TZIDHA
};

const register = async (full_name, email, password) => {
  const res = await api.post("/auth/register", { full_name, email, password });
  const token = res.data.token || res.data.access_token;
  const userData = res.data.user;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(userData));
  setUser(userData);

  return userData; // ⭐ HADI KHASSEK TZIDHA
};

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}