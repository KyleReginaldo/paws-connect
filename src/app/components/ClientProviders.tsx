'use client';

import { ConfirmationProvider } from '@/components/ui/confirmation';
import { NotificationProvider } from '@/components/ui/notification';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '../context/AuthContext';
import { ChatFiltersProvider } from '../context/ChatFiltersContext';
import { FundraisingProvider } from '../context/FundraisingContext';
import { PetsProvider } from '../context/PetsContext';
import { UsersProvider } from '../context/UsersContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <NotificationProvider>
      <ConfirmationProvider>
        <AuthProvider>
          <PetsProvider>
            <UsersProvider>
              <FundraisingProvider>
                <ChatFiltersProvider>
                  {children}
                  <Toaster richColors position="top-right" />
                </ChatFiltersProvider>
              </FundraisingProvider>
            </UsersProvider>
          </PetsProvider>
        </AuthProvider>
      </ConfirmationProvider>
    </NotificationProvider>
  );
}
