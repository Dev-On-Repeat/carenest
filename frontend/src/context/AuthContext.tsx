import React, { createContext, useContext, useState } from 'react';
import { User, Language, TextSize, UserRole } from '../types';
import { api, resetDemoData } from '../services/api';
import { visitSession } from '../services/visitSession';
import { offlineStorage } from '../services/offlineStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  language: Language;
  textSize: TextSize;
  soundEnabled: boolean;
  setLanguage: (lang: Language) => void;
  setTextSize: (size: TextSize) => void;
  setSoundEnabled: (enabled: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Parameters<typeof api.auth.register>[0]) => Promise<void>;
  logout: () => void;
  demoLogin: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const [textSize, setTextSizeState] = useState<TextSize>('large');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (user) api.auth.updateMe({ preferred_language: lang }).catch(() => {});
  };
  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    if (user) api.auth.updateMe({ text_size: size }).catch(() => {});
  };
  const acceptSignIn = (auth: { access_token: string; user: User }) => {
    visitSession.start(auth);
    setToken(auth.access_token);
    setUser(auth.user);
    setLanguageState(auth.user.preferred_language || 'en');
    setTextSizeState(auth.user.text_size || 'large');
  };
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try { acceptSignIn(await api.auth.login({ email, password })); }
    finally { setIsLoading(false); }
  };
  const register: AuthContextType['register'] = async data => {
    setIsLoading(true);
    try { acceptSignIn(await api.auth.register(data)); }
    finally { setIsLoading(false); }
  };
  const logout = () => {
    visitSession.end();
    resetDemoData();
    void offlineStorage.clearAll();
    setToken(null);
    setUser(null);
    setLanguageState('en');
    setTextSizeState('large');
    setSoundEnabled(true);
  };
  const demoLogin = (role: UserRole) => login(
    role === 'caregiver' ? 'dr.priya.demo@carenest.ai' : 'ramakrishna.demo@carenest.ai',
    'DemoPassword123!',
  );

  return <AuthContext.Provider value={{ user, token, isLoading, language, textSize, soundEnabled, setLanguage, setTextSize, setSoundEnabled, login, register, logout, demoLogin }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
