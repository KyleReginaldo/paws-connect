'use client';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './supabase/supabase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  useEffect(() => {
    // Save current path before auth state changes
    const originalPath = window.location.pathname;
    const isAuthPage = originalPath.startsWith('/auth');

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        // Save intended destination for post-login redirect
        if (!isAuthPage) {
          localStorage.setItem('postLoginRedirect', originalPath);
        }
        router.replace('/auth/signin');
      } else {
        const redirectPath = localStorage.getItem('postLoginRedirect') || '/dashboard';
        localStorage.removeItem('postLoginRedirect');

        if (window.location.pathname !== redirectPath) {
          router.replace(redirectPath);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
