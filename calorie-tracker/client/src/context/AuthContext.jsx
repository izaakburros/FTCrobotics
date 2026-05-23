import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('ct_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ct_user');
    try { return stored ? JSON.parse(stored) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback((newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('ct_token', newToken);
    localStorage.setItem('ct_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('ct_user', JSON.stringify(userData));
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, loading, setLoading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
