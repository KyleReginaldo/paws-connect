'use client';
import RouteGuard from '@/components/RouteGuard';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from './context/AuthContext';
import { FundraisingProvider } from './context/FundraisingContext';
import { PetsProvider } from './context/PetsContext';
import { UsersProvider } from './context/UsersContext';
import './globals.css';

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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <PetsProvider>
            <UsersProvider>
              <FundraisingProvider>
                <RouteGuard>{children}</RouteGuard>
              </FundraisingProvider>
            </UsersProvider>
          </PetsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
