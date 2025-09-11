'use client';

import RouteGuard from '@/components/RouteGuard';
import { AuthProvider } from '../context/AuthContext';
import { FundraisingProvider } from '../context/FundraisingContext';
import { PetsProvider } from '../context/PetsContext';
import { UsersProvider } from '../context/UsersContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <PetsProvider>
        <UsersProvider>
          <FundraisingProvider>
            <RouteGuard>{children}</RouteGuard>
          </FundraisingProvider>
        </UsersProvider>
      </PetsProvider>
    </AuthProvider>
  );
}
