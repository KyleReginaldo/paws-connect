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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Auth signin error:', error);
        setStatus(AuthStatus.error);
        setError(error.message);
        return;
      }

      // After successful authentication, check user's role
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user details to check role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData) {
          console.error('Error fetching user data:', userError);
          await supabase.auth.signOut();
          setStatus(AuthStatus.error);
          setError('Unable to verify user permissions');
          return;
        }

        // Check if user has admin (1) or staff (2) role
        if (userData.role !== 1 && userData.role !== 2) {
          console.error('Invalid user role:', userData.role);
          // Sign out users with role 3 or other roles
          await supabase.auth.signOut();
          setStatus(AuthStatus.error);
          setError('Access denied. Only admin and staff members can sign in.');
          return;
        }

        // User has valid role, proceed with authentication
        setUserId(session.user.id);
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
    await supabase.auth.signOut();
    setUserId(null);
    setUserRole(null);
    setUser(null);
    setStatus(AuthStatus.unauthenticated);
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

  return (
    <AuthContext.Provider
      value={{ userId, userRole, onLogin, status, errorMessage, onSignup, user, signOut }}
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
