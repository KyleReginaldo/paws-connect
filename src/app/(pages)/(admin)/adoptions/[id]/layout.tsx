import { AuthProvider } from '@/app/context/AuthContext';
import { FundraisingProvider } from '@/app/context/FundraisingContext';
import { PetsProvider } from '@/app/context/PetsContext';
import { UsersProvider } from '@/app/context/UsersContext';
import { ConfirmationProvider } from '@/components/ui/confirmation';
import { NotificationProvider } from '@/components/ui/notification';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Adoptions Management - PawsConnect',
  description: 'Manage pet adoptions and applications',
  icons: {
    icon: '/playstore.png',
  },
};

export default function AdoptionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <NotificationProvider>
        <ConfirmationProvider>
          <AuthProvider>
            <PetsProvider>
              <UsersProvider>
                <FundraisingProvider>
                  <main className="min-h-screen bg-gray-50">{children}</main>
                </FundraisingProvider>
              </UsersProvider>
            </PetsProvider>
          </AuthProvider>
        </ConfirmationProvider>
      </NotificationProvider>
    </div>
  );
}
