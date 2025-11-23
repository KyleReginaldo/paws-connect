'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';

export default function ConditionalLayout() {
  const pathname = usePathname();

  // Hide NavBar on auth and dashboard routes (they have their own layouts)
  const hideNavBar = pathname?.startsWith('/auth') || pathname?.startsWith('/dashboard');

  if (hideNavBar) return null;

  return <NavBar />;
}
