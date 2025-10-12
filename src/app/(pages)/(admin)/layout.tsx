'use client';
import { useAuth } from '@/app/context/AuthContext';
import { EventsProvider } from '@/app/context/EventsContext';
import RouteGuard from '@/components/RouteGuard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Calendar, Dog, HandCoins, Heart, LayoutDashboard, LogOut, UsersRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useState } from 'react';
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
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  // const router = useRouter();
  const { signOut, userRole, user } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    setShowLogoutDialog(false);

    try {
      console.log('Logout initiated from admin layout');

      // Call the signOut function from AuthContext
      await signOut();

      console.log('Logout completed from admin layout');
    } catch (error) {
      console.error('Error during logout:', error);

      // Force hard redirect if signOut fails
      if (typeof window !== 'undefined') {
        console.log('Forcing redirect due to logout error');
        window.location.href = '/auth/signin';
      }
    }
  };

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
                <div className="space-y-2">
                  <div className="group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-slate-800/50">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-[#FE5D26] rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {user?.username?.charAt(0).toUpperCase() || 'A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user?.username || 'Admin'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {userRole === 1 ? 'Administrator' : 'Staff Member'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setShowLogoutDialog(true)}
                        className="text-white hover:bg-red-500/20 hover:text-red-300 border border-slate-700 hover:border-red-500/50 transition-all duration-200 bg-slate-800/30"
                        tooltip="Logout"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </div>
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
                </Suspense>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>

        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out? You&apos;ll need to log in again to access the
                admin panel.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </EventsProvider>
    </RouteGuard>
  );
}
