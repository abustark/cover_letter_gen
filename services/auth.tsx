import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google';

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
const AUTH_STORAGE_KEY = 'covercraft_google_auth';

export interface AuthUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface StoredAuth {
  credential: string;
  user: AuthUser;
  exp: number;
}

interface AuthContextValue {
  clientId: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  signInError: string | null;
  handleCredential: (credential: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* Decode a Google ID token (JWT) in the browser. Only the user profile and
   expiry are read — the token is never sent anywhere else. */
const decodeCredential = (credential: string): { user: AuthUser; exp: number } | null => {
  try {
    const payload = credential.split('.')[1] || '';
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = JSON.parse(window.atob(padded)) as Record<string, unknown>;
    if (!decoded || typeof decoded !== 'object' || typeof decoded.sub !== 'string') {
      return null;
    }
    return {
      user: {
        sub: decoded.sub,
        name: typeof decoded.name === 'string' ? decoded.name : 'Google User',
        email: typeof decoded.email === 'string' ? decoded.email : '',
        picture: typeof decoded.picture === 'string' ? decoded.picture : undefined,
      },
      exp: typeof decoded.exp === 'number' ? decoded.exp * 1000 : 0,
    };
  } catch {
    return null;
  }
};

const readStoredAuth = (): StoredAuth | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.credential || !parsed?.user || typeof parsed.exp !== 'number') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    if (Date.now() >= parsed.exp) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const GoogleAuthInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredAuth()?.user ?? null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setIsInitializing(false), 50);
    return () => window.clearTimeout(t);
  }, []);

  const handleCredential = useCallback((credential: string) => {
    setSignInError(null);
    const decoded = decodeCredential(credential);
    if (!decoded) {
      setSignInError('Could not read your Google profile. Please try signing in again.');
      return;
    }
    const stored: StoredAuth = { credential, user: decoded.user, exp: decoded.exp };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage unavailable — session lives in memory for this tab only.
    }
    setUser(decoded.user);
  }, []);

  const signOut = useCallback(() => {
    googleLogout();
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore — nothing else to clean up.
    }
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    clientId: CLIENT_ID,
    user,
    isAuthenticated: !!user,
    isInitializing,
    signInError,
    handleCredential,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!CLIENT_ID) {
    const value: AuthContextValue = {
      clientId: null,
      user: null,
      isAuthenticated: false,
      isInitializing: false,
      signInError: null,
      handleCredential: () => {},
      signOut: () => {},
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <GoogleAuthInner>{children}</GoogleAuthInner>
    </GoogleOAuthProvider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return ctx;
};
