'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/supabase';
import axios, { AxiosError } from 'axios';
import { User } from '@/config/models/users';

export enum AuthStatus {
  authenticated,
  unauthenticated,
  error,
  authenticating,
}
type AuthContextType = {
  onLogin: (email: string, password: string) => void;
  status: AuthStatus | undefined;
  errorMessage: string | undefined;

  onSignup: (
    email: string,
    password: string,
    username: string,
    role: number,
    phone_number: string,
  ) => void;
  user: User | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setError] = useState<string | undefined>(undefined);
  const _handleListenAuth = () => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
    });
  };
  const onLogin = async (email: string, password: string) => {
    setStatus(AuthStatus.authenticating);
    const { data, error } = await supabase.auth.signInWithPassword({
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

  useEffect(() => {
    _handleListenAuth();
  });
  return (
    <AuthContext.Provider value={{ onLogin, status, errorMessage, onSignup, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('No AuthContext found!');
  return context;
};
