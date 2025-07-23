"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";

enum AuthStatus {
  authenticated,
  unauthenticated,
  error,
  authenticating,
}
type AuthContextType = {
  onLogin: (email: string, password: string) => void;
  status: AuthStatus | undefined;
  errorMessage: string | undefined;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus | undefined>(undefined);
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

  useEffect(() => {
    _handleListenAuth();
  });
  return (
    <AuthContext.Provider value={{ onLogin, status, errorMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("No AuthContext found!");
  return context;
};
