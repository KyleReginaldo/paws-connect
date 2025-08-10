'use client';

import SideBarTile from '@/components/SideBarTile';
import { Dog, HandCoins, LayoutDashboard, UsersRound } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const router = useRouter();
  return (
    <div className="flex h-screen bg-[#EEEEEE]">
      <div className="hidden md:flex flex-col items-start justify-start w-[200px] h-full bg-white">
        <h1 className="p-[10px] font-semibold text-[#FE5D26] mb-[8px] self-center text-[18px]">
          Admin
        </h1>

        <ul className="flex flex-col gap-[16px] text-[#3D3C42] w-full">
          <SideBarTile
            title="Dashboard"
            icon={LayoutDashboard}
            isActive={isActive('/dashboard')}
            onButtonClick={() => {
              router.push('/dashboard');
            }}
          />
          <SideBarTile
            title="Manage Staff"
            icon={UsersRound}
            isActive={isActive('/manage-staff')}
            onButtonClick={() => {
              router.push('/manage-staff');
            }}
          />
          <SideBarTile
            title="Manage Pet"
            icon={Dog}
            isActive={isActive('/manage-pet')}
            onButtonClick={() => {
              router.push('/manage-pet');
            }}
          />
          <SideBarTile
            title="Fundraising"
            icon={HandCoins}
            isActive={isActive('/fundraising')}
            onButtonClick={() => {
              router.push('/fundraising');
            }}
          />
        </ul>
      </div>
      <div className="flex-1 h-full overflow-y-auto p-4">
        {modal}
        {children}
      </div>
    </div>
  );
}
