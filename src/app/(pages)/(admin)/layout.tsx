'use client';
import { useAuth } from '@/app/context/AuthContext';
import { EventsProvider } from '@/app/context/EventsContext';
import RouteGuard from '@/components/RouteGuard';
// Removed sign-out alert dialog; sign-out now lives on the Settings page
import ClientOnly from '@/app/components/ClientOnly';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Calendar,
  Dog,
  HandCoins,
  Heart,
  LayoutDashboard,
  MessageCircleHeart,
  Settings,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import logoHorizontal from '../../../../public/logo_horizontal.png';
import playstore from '../../../../public/playstore.png';
import Pending from './pending/page';

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Adoptions', icon: Heart, path: '/adoptions' },
  { title: 'Manage Users', icon: UsersRound, path: '/manage-users' },
  { title: 'Manage Pets', icon: Dog, path: '/manage-pet' },
  { title: 'Manage Events', icon: Calendar, path: '/manage-events' },
  { title: 'Fundraising', icon: HandCoins, path: '/fundraising' },
  { title: 'Posts', icon: MessageCircleHeart, path: '/posts' },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  // const router = useRouter();
  const { user } = useAuth();

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
      case '/posts':
        return 'Posts';
      case '/settings':
        return 'Settings';
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
      case '/posts':
        return 'Manage and oversee posts';
      case '/settings':
        return 'Update your profile and password';
      default:
        return '';
    }
  };

  // Make the open sidebar a bit narrower while keeping collapsed behavior intact
  const sidebarVars = {
    ['--sidebar-width' as string]: '11rem',
  } as unknown as React.CSSProperties;

  return user?.status === 'PENDING' ? (
    <Pending />
  ) : (
    <RouteGuard>
      <EventsProvider>
        <SidebarProvider defaultOpen={true} style={sidebarVars}>
          <div className="flex h-screen w-full overflow-x-hidden min-w-0">
            <Sidebar collapsible="icon" className="bg-slate-900 border-r border-slate-700">
              <SidebarHeader className="p-4 bg-slate-900">
                <div className="flex justify-center">
                  <Image
                    src={logoHorizontal}
                    alt="Logo"
                    height={30}
                    className="group-data-[collapsible=icon]:hidden"
                  />
                  <Image
                    src={playstore}
                    alt="Playstore Logo"
                    height={48}
                    width={48}
                    className="group-data-[collapsible=icon]:block hidden"
                  />
                </div>
              </SidebarHeader>
              <SidebarContent className="bg-slate-900">
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {menuItems.map((item) => (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.path}
                            className="text-white hover:bg-[#FE5D26] hover:text-white data-[active=true]:bg-[#FE5D26] data-[active=true]:text-white"
                            tooltip={item.title}
                          >
                            <Link href={item.path} prefetch>
                              <item.icon className="h-5 w-5" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter className="p-4 bg-slate-900 border-t border-slate-700">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="text-white hover:bg-[#FE5D26] hover:text-white border border-slate-700 hover:border-[#FE5D26] transition-all duration-200 bg-slate-800/30"
                      tooltip="Settings"
                    >
                      <Link href="/settings" prefetch>
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>
            <SidebarInset className="flex-1 flex flex-col min-w-0">
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
                <SidebarTrigger className="ml-1" />
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <h1 className="text-sm font-semibold text-gray-900">{getTitle()}</h1>
                    <p className="text-xs font-light text-gray-700">{getSubtitle()}</p>
                  </div>
                  {/* <div
                    className={`${userRole === 1 ? 'bg-orange-500' : 'bg-red-500'} flex gap-1 items-center py-1.5 px-3 rounded-full text-xs text-white`}
                  >
                    <div className="rounded-full h-1.5 w-1.5 bg-white"></div>
                    {userRole === 1 ? 'ADMIN' : 'STAFF'}
                  </div> */}
                </div>
              </header>
              <main className="flex-1 overflow-auto bg-gray-50 min-w-0">
                <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
                  {children}
                  <ClientOnly />
                </Suspense>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>

        {/** Sign out dialog removed; sign out is available within Settings page */}
      </EventsProvider>
    </RouteGuard>
  );
}
