'use client';

import { useAuth } from '@/app/context/AuthContext';
import RouteGuard from '@/components/RouteGuard';
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
import { useState } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const router = useRouter();
  const { signOut, userRole } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsSheetOpen(false); // Close the sheet after navigation
  };

  return (
    <RouteGuard>
      <div className="flex h-screen bg-[#FFFCFB]">
        <div className="hidden md:flex flex-col justify-between w-[200px] h-full bg-[#333446]">
          <div>
           <div className="flex justify-center">
              <h1 className="p-[10px] font-semibold text-[#FE5D26] mb-[8px] text-[18px]">
                {userRole === 1 ? 'Admin' : 'Staff'}
              </h1>
            </div>
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
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                          onClick={() => handleNavigation('/dashboard')}
                        >
                          Dashboard
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full text-left"
                          onClick={() => handleNavigation('/manage-users')}
                        >
                          Manage Users
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full text-left"
                          onClick={() => handleNavigation('/manage-pet')}
                        >
                          Manage Pets
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant="ghost"
                          className="w-full text-left"
                          onClick={() => handleNavigation('/fundraising')}
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
                        setIsSheetOpen(false);
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
    </RouteGuard>
  );
}
