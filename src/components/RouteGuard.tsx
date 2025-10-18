'use client';
import { AuthStatus, useAuth } from '@/app/context/AuthContext';
import { LoadingSkeleton } from '@/components/ui/skeleton-patterns';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('RouteGuard - Status:', status, 'Pathname:', pathname);

    if (status === AuthStatus.loading || status === AuthStatus.authenticating) return;

    const isAuthPage = pathname?.startsWith('/auth') || false;
    const isAdminPage =
      pathname?.startsWith('/dashboard') ||
      pathname?.startsWith('/adoptions') ||
      pathname?.startsWith('/manage-') ||
      pathname?.startsWith('/fundraising') ||
      pathname?.startsWith('/settings') ||
      false;

    // Only redirect if user is trying to access admin pages without authentication
    if (status === AuthStatus.unauthenticated && isAdminPage) {
      console.log('Redirecting to signin - user not authenticated for admin area');
      router.replace('/auth/signin');
    } else if (status === AuthStatus.authenticated && isAuthPage) {
      console.log('Redirecting to dashboard - user already authenticated');
      router.replace('/dashboard');
    }
  }, [status, pathname, router]);

  if (status === AuthStatus.loading || status === AuthStatus.authenticating) {
    return (
      <div className="min-h-screen">
        <LoadingSkeleton lines={10} />
      </div>
    );
  }

  return <>{children}</>;
}
