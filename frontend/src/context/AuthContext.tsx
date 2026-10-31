import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getStoredUser, setStoredUser, clearAuthToken, setAuthToken, apiFetch } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  login: (token: string, userData: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const profile = await apiFetch('/auth/me');
      setUser(profile);
      setStoredUser(profile);
    } catch {
      setUser(null);
      clearAuthToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, userData: UserProfile) => {
    setAuthToken(token);
    setStoredUser(userData);
    setUser(userData);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

