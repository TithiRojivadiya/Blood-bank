import { createContext, useState, useEffect } from "react";
import { API_URL } from "../lib/env";

const STORAGE_KEY = "blood_auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [recipientKey, setRecipientKey] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { user: u, recipient_key: rk, role: r } = JSON.parse(raw);
        if (u && rk) {
          setUser(u);
          setRecipientKey(rk);
          setRole(r || null);
        }
      }
    } catch (_) {}
  }, []);

  const persist = (u, rk, r) => {
    setUser(u);
    setRecipientKey(rk);
    setRole(r || null);
    if (u && rk) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, recipient_key: rk, role: r }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (roleIn, email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: roleIn, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Login failed");
    const u = { id: data.user.id, email: data.user.email, role: roleIn };
    persist(u, data.recipient_key, roleIn);
  };

  const signup = async (roleIn, body) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: roleIn, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Signup failed");
    const u = { id: data.user.id, email: data.user.email, role: roleIn };
    persist(u, data.recipient_key, roleIn);
  };

  const logout = () => persist(null, null, null);

  return (
    <AuthContext.Provider value={{ role, setRole, user, recipientKey, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
