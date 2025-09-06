'use client';

import { useAuth } from '@/app/context/AuthContext';
import SideBarTile from '@/components/SideBarTile';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Dog, HandCoins, LayoutDashboard, PanelLeftIcon, UsersRound } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <div className="flex h-screen bg-[#EEEEEE]">
      <div className="hidden md:flex flex-col justify-between w-[200px] h-full bg-white">
        <div>
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
              title="Manage Users"
              icon={UsersRound}
              isActive={isActive('/manage-users')}
              onButtonClick={() => {
                router.push('/manage-users');
              }}
            />
            <SideBarTile
              title="Manage Pets"
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

        <div className="w-full p-4">
          <Button
            variant="ghost"
            className="w-full text-left"
            onClick={async () => {
              await signOut();
            }}
          >
            Logout
          </Button>
        </div>
      </div>
      <div className="flex-1 h-full overflow-y-auto p-0">
        {/* Mobile top bar */}
        <div className="md:hidden bg-white border-b">
          <div className="flex items-center justify-between px-3 py-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <PanelLeftIcon />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="p-2">
                  <ul className="flex flex-col gap-2">
                    <li>
                      <Button
                        variant="ghost"
                        className="w-full text-left"
                        onClick={() => router.push('/dashboard')}
                      >
                        Dashboard
                      </Button>
                    </li>
                    <li>
                      <Button
                        variant="ghost"
                        className="w-full text-left"
                        onClick={() => router.push('/manage-users')}
                      >
                        Manage Users
                      </Button>
                    </li>
                    <li>
                      <Button
                        variant="ghost"
                        className="w-full text-left"
                        onClick={() => router.push('/manage-pet')}
                      >
                        Manage Pets
                      </Button>
                    </li>
                    <li>
                      <Button
                        variant="ghost"
                        className="w-full text-left"
                        onClick={() => router.push('/fundraising')}
                      >
                        Fundraising
                      </Button>
                    </li>
                  </ul>
                </div>
                <SheetFooter>
                  <Button
                    variant="ghost"
                    className="w-full text-left"
                    onClick={async () => {
                      await signOut();
                    }}
                  >
                    Logout
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <div className="font-semibold text-[#FE5D26]">Admin</div>
            <div />
          </div>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
