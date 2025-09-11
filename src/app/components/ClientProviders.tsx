'use client';

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
          <FundraisingProvider>{children}</FundraisingProvider>
        </UsersProvider>
      </PetsProvider>
    </AuthProvider>
  );
}
