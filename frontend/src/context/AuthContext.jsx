import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('healthform_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('healthform_token');
      const storedUser = localStorage.getItem('healthform_user');
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with backend
          const res = await api.get('/api/auth/me');
          setUser(res.data);
          localStorage.setItem('healthform_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn("Session expired or invalid, clearing stored credentials.");
          localStorage.removeItem('healthform_token');
          localStorage.removeItem('healthform_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('healthform_token', access_token);
    localStorage.setItem('healthform_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (email, password, full_name) => {
    const res = await api.post('/api/auth/register', { email, password, full_name });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('healthform_token', access_token);
    localStorage.setItem('healthform_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const demoLogin = async () => {
    const res = await api.post('/api/auth/demo-login');
    const { access_token, user: userData } = res.data;
    localStorage.setItem('healthform_token', access_token);
    localStorage.setItem('healthform_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const updateUser = (newUserData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newUserData };
      localStorage.setItem('healthform_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('healthform_token');
    localStorage.removeItem('healthform_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, demoLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
