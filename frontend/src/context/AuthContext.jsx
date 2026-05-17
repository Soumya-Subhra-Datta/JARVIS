import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jarvis_token');
    const saved = localStorage.getItem('jarvis_user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('jarvis_token');
        localStorage.removeItem('jarvis_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('jarvis_token', res.data.token);
    localStorage.setItem('jarvis_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    localStorage.setItem('jarvis_token', res.data.token);
    localStorage.setItem('jarvis_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    localStorage.removeItem('jarvis_token');
    localStorage.removeItem('jarvis_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
      localStorage.setItem('jarvis_user', JSON.stringify(res.data.user));
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
