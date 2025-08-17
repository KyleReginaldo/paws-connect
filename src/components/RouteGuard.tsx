'use client';
import { AuthStatus, useAuth } from '@/app/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === AuthStatus.loading) return;
    const isAuthPage = pathname?.startsWith('/auth') || false;
    const isPublicPage = pathname === '/' || isAuthPage;

    if (status === AuthStatus.unauthenticated && !isPublicPage) {
      console.log('Redirecting to signin - user not authenticated');
      router.replace('/auth/signin');
    } else if (status === AuthStatus.authenticated && isAuthPage) {
      console.log('Redirecting to dashboard - user already authenticated');
      router.replace('/dashboard');
    }
  }, [status, pathname, router]);

  if (status === AuthStatus.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
