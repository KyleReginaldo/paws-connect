'use client';
import { User } from '@/config/models/users';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/supabase';

export enum AuthStatus {
  loading,
  authenticated,
  unauthenticated,
  error,
  authenticating,
}

type AuthContextType = {
  userId: string | null;
  onLogin: (email: string, password: string) => void;
  status: AuthStatus;
  errorMessage: string | undefined;
  onSignup: (
    email: string,
    password: string,
    username: string,
    role: number,
    phone_number: string,
  ) => void;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.loading);
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  const onLogin = async (email: string, password: string) => {
    setStatus(AuthStatus.authenticating);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus(AuthStatus.error);
      setError(error.message);
    } else {
      setStatus(AuthStatus.authenticated);
    }
  };

  const onSignup = async (
    email: string,
    password: string,
    username: string,
    role: number = 2,
    phone_number: string,
  ) => {
    try {
      const response = await axios.post('/api/v1/users', {
        email,
        password,
        username,
        role,
        phone_number,
      });
      console.log(response.data['data']);
      setUser(response.data.data);
    } catch (e) {
      const error = e as AxiosError;
      console.log(`signup error: ${error.message}`);
      setStatus(AuthStatus.error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setUser(null);
    setStatus(AuthStatus.unauthenticated);
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, 'Session:', !!session?.user);

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUserId(session.user.id);
          setStatus(AuthStatus.authenticated);
        } else {
          setUserId(null);
          setStatus(AuthStatus.unauthenticated);
          // Don't automatically redirect here - let RouteGuard handle it for protected routes only
        }
      } else if (event === 'SIGNED_IN') {
        setUserId(session?.user?.id || null);
        setStatus(AuthStatus.authenticated);

        // only redirect if user is on sign-in page
        try {
          if (typeof window !== 'undefined' && window.location.pathname === '/auth/signin') {
            router.replace('/dashboard');
          }
        } catch {
          // ignore
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setStatus(AuthStatus.unauthenticated);
        // Only redirect to signin if user is currently on a protected page
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isProtectedRoute =
            currentPath.startsWith('/dashboard') ||
            currentPath.startsWith('/manage-') ||
            currentPath.startsWith('/fundraising');
          if (isProtectedRoute) {
            router.replace('/auth/signin');
          }
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ userId, onLogin, status, errorMessage, onSignup, user, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('No AuthContext found!');
  return context;
};
