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
  userRole: number | null;
  onLogin: (email: string, password: string) => void;
  status: AuthStatus;
  errorMessage: string | undefined;
  onSignup: (
    email: string,
    password: string,
    username: string,
    role: number,
    phone_number: string,
    status?: string,
  ) => void;
  user: User | null;
  signOut: () => Promise<void>;
  markOnboarded: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.loading);
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  const onLogin = async (email: string, password: string) => {
    try {
      setStatus(AuthStatus.authenticating);
      setError(undefined);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Auth signin error:', error);
        setStatus(AuthStatus.error);
        setError(error.message);
        return;
      }

      if (data?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          await supabase.auth.signOut();
          setStatus(AuthStatus.error);
          setError('Unable to verify user permissions');
          return;
        }

        // Check if user has admin (1) or staff (2) role
        if (userData.role !== 1) {
          console.error('Invalid user role:', userData.role);
          // Sign out users with role 3 or other roles
          await supabase.auth.signOut();
          setStatus(AuthStatus.error);
          setError('Access denied. Only admin and staff members can sign in.');
          return;
        }
        // User has valid role, proceed with authentication
        setUserId(data.user.id);
        setUserRole(userData.role);
        setUser(userData as User);
        setStatus(AuthStatus.authenticated);
        setError(undefined); // Clear any previous errors
        console.log('Login successful for user:', userData.username);
      }
    } catch (error) {
      console.error('Login error:', error);
      // If role check fails, sign out the user
      await supabase.auth.signOut();
      setStatus(AuthStatus.error);
      setError('Unable to verify user permissions');
    }
  };

  const onSignup = async (
    email: string,
    password: string,
    username: string,
    role: number = 2,
    phone_number: string,
    status?: string,
  ) => {
    try {
      const response = await axios.post('/api/v1/users', {
        email,
        password,
        username,
        role,
        phone_number,
        status,
      });
      console.log(`user response: ${response.data['data']}`);
      setUser(response.data.data);
    } catch (e) {
      const error = e as AxiosError;
      console.log(`signup error: ${error.message}`);
      setStatus(AuthStatus.error);
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');

      setUserId(null);
      setUserRole(null);
      setUser(null);
      setStatus(AuthStatus.unauthenticated);
      setError(undefined);
      // Sign out from Supabase with scope 'global' to clear all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error('Error during Supabase sign out:', error);
        // Continue with navigation even if Supabase signout fails
      }

      // Clear any stored tokens or session data
      if (typeof window !== 'undefined') {
        // Clear localStorage items that might contain auth data
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });

        // Clear sessionStorage as well
        sessionStorage.clear();

        console.log('Redirecting to signin page...');
        // Use window.location.href for a hard redirect to ensure clean state
        window.location.href = '/auth/signin';
      }

      console.log('Sign out completed successfully');
    } catch (error) {
      console.error('Unexpected error during sign out:', error);

      // Ensure local state is still cleared even if there's an error
      setUserId(null);
      setUserRole(null);
      setUser(null);
      setStatus(AuthStatus.unauthenticated);
      setError(undefined);

      // Force redirect regardless of error
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Explicit initial session check to avoid race conditions with RouteGuard
    (async () => {
      try {
        setStatus(AuthStatus.loading);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Validate role and load user
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError || !userData || (userData.role !== 1 && userData.role !== 2)) {
            await supabase.auth.signOut();
            setUserId(null);
            setUserRole(null);
            setUser(null);
            setStatus(AuthStatus.unauthenticated);
          } else {
            setUserId(session.user.id);
            setUserRole(userData.role);
            setUser(userData as User);
            setStatus(AuthStatus.authenticated);
            setError(undefined);
          }
        } else {
          setUserId(null);
          setUserRole(null);
          setUser(null);
          setStatus(AuthStatus.unauthenticated);
        }
      } catch (error) {
        console.error('Initial session check error:', error);
        setUserId(null);
        setUserRole(null);
        setUser(null);
        setStatus(AuthStatus.unauthenticated);
      }

      // Now set up the listener for further auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, 'Session:', !!session?.user);

        if (event === 'SIGNED_IN') {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session?.user?.id ?? '')
              .single();

            if (userError || !userData || (userData.role !== 1 && userData.role !== 2)) {
              await supabase.auth.signOut();
              setUserId(null);
              setUserRole(null);
              setStatus(AuthStatus.unauthenticated);
              setError('Access denied. Only admin and staff members can access this area.');
              return;
            }

            setUserId(session?.user?.id || null);
            setUserRole(userData.role);
            setStatus(AuthStatus.authenticated);
            setUser(userData as User);

            if (typeof window !== 'undefined' && window.location.pathname === '/auth/signin') {
              router.replace('/dashboard');
            }
          } catch (error) {
            console.error('Error checking user role:', error);
            await supabase.auth.signOut();
            setUserId(null);
            setUserRole(null);
            setStatus(AuthStatus.unauthenticated);
            setError('Unable to verify user permissions');
          }
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setUserRole(null);
          setUser(null);
          setStatus(AuthStatus.unauthenticated);
          setError(undefined);

          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isAdminRoute =
              currentPath.startsWith('/dashboard') ||
              currentPath.startsWith('/adoptions') ||
              currentPath.startsWith('/manage-') ||
              currentPath.startsWith('/fundraising');
            if (isAdminRoute) {
              router.replace('/auth/signin');
            }
          }
        }
      });

      unsubscribe = () => authListener?.subscription?.unsubscribe?.();
    })();

    return () => {
      unsubscribe?.();
    };
  }, [router]);

  const markOnboarded = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ onboarded: true })
        .eq('id', userId)
        .select('*')
        .single();

      if (!error && data) {
        setUser(data as User);
      }
    } catch (e) {
      console.error('Failed to mark onboarded', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        userRole,
        onLogin,
        status,
        errorMessage,
        onSignup,
        user,
        signOut,
        markOnboarded,
      }}
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
