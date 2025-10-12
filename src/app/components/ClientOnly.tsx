'use client';

import dynamic from 'next/dynamic';
const GlobalChatWidget = dynamic(() => import('@/components/GlobalChatWidget'), { ssr: false });

export default function ClientOnly() {
  return (
    <>
      <GlobalChatWidget />
    </>
  );
}
