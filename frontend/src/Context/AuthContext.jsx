import { createContext, useState } from "react";
import { API_URL } from "../lib/env";

const STORAGE_KEY = "blood_auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const initial = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { user: null, recipientKey: null, role: null };
      const parsed = JSON.parse(raw);
      const u = parsed?.user ?? null;
      const rk = parsed?.recipient_key ?? null;
      const r = parsed?.role ?? u?.role ?? null;
      if (!u?.id || !rk) return { user: null, recipientKey: null, role: null };
      return { user: u, recipientKey: rk, role: r };
    } catch (e) {
      // If local storage got corrupted, clear it so pages don't get stuck loading forever
      localStorage.removeItem(STORAGE_KEY);
      return { user: null, recipientKey: null, role: null };
    }
  })();

  const [role, setRole] = useState(initial.role);
  const [user, setUser] = useState(initial.user);
  const [recipientKey, setRecipientKey] = useState(initial.recipientKey);

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
    const usr = data.user;
    if (!usr || !usr.id) throw new Error("Invalid login response");
    // Keep the full user object from backend (different roles have different fields)
    const u = { ...usr, role: roleIn };
    persist(u, data.recipient_key ?? `${roleIn.toLowerCase()}_${usr.id}`, roleIn);
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
    <AuthContext.Provider value={{ role, setRole, user, recipientKey, login, signup, logout, persist }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
