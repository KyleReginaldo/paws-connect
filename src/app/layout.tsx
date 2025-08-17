'use client';
import RouteGuard from '@/components/RouteGuard';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from './context/AuthContext';
import { PetsProvider } from './context/PetsContext';
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
            <RouteGuard>{children}</RouteGuard>
          </PetsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
