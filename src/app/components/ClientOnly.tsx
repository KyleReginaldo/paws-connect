'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
const GlobalChatWidget = dynamic(() => import('@/components/GlobalChatWidget'), { ssr: false });

export default function ClientOnly() {
  const pathname = usePathname();
  // Hide global chat on landing (home) page only
  if (pathname === '/') return null;
  return <GlobalChatWidget />;
}
