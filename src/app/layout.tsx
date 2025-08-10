'use client';
import { Geist, Geist_Mono } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import './globals.css';
import { supabase } from './supabase/supabase';
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
    const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const originalPath = window.location.pathname;
      const isAuthPage = originalPath.startsWith('/auth');
      if (!session?.user && !isAuthPage) {
        router.replace('/auth/signin');
      } else if (session?.user && isAuthPage) {
        router.replace('/dashboard');
      }
      // If authenticated and on a protected page, do nothing
    });
    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, [router]);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
