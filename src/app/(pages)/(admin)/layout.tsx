'use client';
import { useAuth } from '@/app/context/AuthContext';
import { EventsProvider } from '@/app/context/EventsContext';
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
import {
  Calendar,
  Dog,
  HandCoins,
  Heart,
  LayoutDashboard,
  PanelLeftIcon,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import logoHorizontal from '../../../../public/logo_horizontal.png';
import Pending from './pending/page';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const router = useRouter();
  const { signOut, userRole, user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsSheetOpen(false); // Close the sheet after navigation
  };
  console.log(user?.status);

  const getTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/adoptions':
        return 'Adoptions';
      case '/manage-users':
        return 'Manage Users';
      case '/manage-pet':
        return 'Manage Pets';
      case '/manage-events':
        return 'Manage Events';
      case '/fundraising':
        return 'Fundraising';
      default:
        return '';
    }
  };

  const getSubtitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Overview of key metrics and activities';
      case '/adoptions':
        return 'Manage and track pet adoptions';
      case '/manage-users':
        return 'View and manage user accounts';
      case '/manage-pet':
        return 'Add, update, or remove pet profiles';
      case '/manage-events':
        return 'Create and manage community events and posts';
      case '/fundraising':
        return 'Oversee fundraising campaigns and donations';
      default:
        return '';
    }
  };
  return user?.status === 'PENDING' ? (
    <Pending />
  ) : (
    <RouteGuard>
      <EventsProvider>
        <div className="flex h-screen bg-[#FFFCFB]">
          <div className="hidden md:flex flex-col justify-between w-[200px] h-full bg-[#333446]">
            <div>
              <div className="flex flex-col justify-center items-center my-[32px]">
                <Image src={logoHorizontal} alt="" height={30} />
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
                  title="Adoptions"
                  icon={Heart}
                  isActive={isActive('/adoptions')}
                  onButtonClick={() => {
                    router.push('/adoptions');
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
                  title="Manage Events"
                  icon={Calendar}
                  isActive={isActive('/manage-events')}
                  onButtonClick={() => {
                    router.push('/manage-events');
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
                            onClick={() => handleNavigation('/adoptions')}
                          >
                            Adoptions
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
                            onClick={() => handleNavigation('/manage-events')}
                          >
                            Manage Events
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
                        className="w-full text-white"
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

            <div className="flex flex-col h-full">
              <div className="flex justify-between mx-[16px] my-[10px] items-start">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{getTitle()}</p>
                  <p className="text-[14px] font-light text-gray-700">{getSubtitle()}</p>
                </div>
                <div
                  className={`${userRole === 1 ? 'bg-orange-500' : 'bg-red-500'} self-start flex gap-[4px] items-center py-[6px] px-[16px] rounded-2xl text-[10px] text-white`}
                >
                  <div className="rounded-full h-[5px] w-[5px] bg-white"></div>{' '}
                  {userRole === 1 ? 'ADMIN' : 'STAFF'}
                </div>
              </div>
              <div className="p-4">{children}</div>
            </div>
          </div>
        </div>
      </EventsProvider>
    </RouteGuard>
  );
}
