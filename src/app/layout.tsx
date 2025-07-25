"use client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { supabase } from "./supabase/supabase";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const _handleListenAuth = () => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.replace("/auth/signin");
      } else {
        router.replace("/dashboard");
      }
    });
  };
  useEffect(() => {
    _handleListenAuth();
  });
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
