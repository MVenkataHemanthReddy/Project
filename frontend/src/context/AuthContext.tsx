import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
  switchDemoUser: (target: 'admin' | 'john' | 'alice') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('helpdesk_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('helpdesk_token');
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
          localStorage.setItem('helpdesk_user', JSON.stringify(res.data.data));
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, token: jwtToken } = res.data.data;
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('helpdesk_token', jwtToken);
    localStorage.setItem('helpdesk_user', JSON.stringify(userData));
  };

  const register = async (name: string, email: string, password: string, role: Role = 'USER') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { user: userData, token: jwtToken } = res.data.data;
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('helpdesk_token', jwtToken);
    localStorage.setItem('helpdesk_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('helpdesk_token');
    localStorage.removeItem('helpdesk_user');
  };

  const switchDemoUser = async (target: 'admin' | 'john' | 'alice') => {
    let email = 'admin@helpdesk.com';
    let password = 'admin123';
    if (target === 'john') {
      email = 'john@example.com';
      password = 'user123';
    } else if (target === 'alice') {
      email = 'alice@example.com';
      password = 'user123';
    }
    await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
