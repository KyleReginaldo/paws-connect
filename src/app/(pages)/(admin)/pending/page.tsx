'use client';

import { useAuth } from '@/app/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Pending = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [timeWaiting, setTimeWaiting] = useState<string>('');

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Calculate time since account creation
  useEffect(() => {
    if (user?.created_at) {
      const createdDate = new Date(user.created_at);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 24) {
        setTimeWaiting(`${diffInHours} hours ago`);
      } else {
        const days = Math.floor(diffInHours / 24);
        setTimeWaiting(`${days} ${days === 1 ? 'day' : 'days'} ago`);
      }
    }
  }, [user]);

  const getStatusInfo = () => {
    switch (user?.status) {
      case 'ACTIVE':
        return {
          color: 'bg-green-50 text-green-600 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Approved',
        };
      case 'INACTIVE':
      case 'pending':
        return {
          color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
          icon: <Clock className="h-4 w-4" />,
          text: 'Pending Approval',
        };
      case 'BANNED':
        return {
          color: 'bg-red-50 text-red-600 border-red-200',
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Rejected',
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-600 border-gray-200',
          icon: <Clock className="h-4 w-4" />,
          text: 'Under Review',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-25/50 to-orange-50/50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Status</h1>
            <p className="text-sm text-gray-600 mt-1">Your account is currently under review</p>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user?.profile_image_link || ''}
                      alt={user?.username || 'User'}
                    />
                    <AvatarFallback className="bg-orange-50 text-orange-600">
                      {user?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{user?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        {/* Status Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-orange-100 mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Account Under Review</CardTitle>
            <CardDescription className="text-base">
              Thank you for registering! Your account is currently being reviewed by our
              administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              <Badge
                variant="outline"
                className={`${statusInfo.color} px-4 py-2 text-sm font-medium`}
              >
                {statusInfo.icon}
                <span className="ml-2">{statusInfo.text}</span>
              </Badge>
            </div>

            <div className="text-sm text-gray-600">
              <p>Application submitted {timeWaiting}</p>
              <p className="mt-2">We typically review applications within 24-48 hours.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Our team will verify your information</li>
                    <li>• You&apos;ll receive an email notification once approved</li>
                    <li>• You can then access all platform features</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="bg-white/80 backdrop-blur-sm border-orange-100 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="h-5 w-5 text-orange-500" />
              Account Information
            </CardTitle>
            <CardDescription>Your submitted account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Username</p>
                    <p className="text-sm text-gray-600">{user?.username || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone Number</p>
                    <p className="text-sm text-gray-600">
                      {user?.phone_number.startsWith('+0')
                        ? user.phone_number.replace('+0', '+63')
                        : user?.phone_number || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Registration Date</p>
                    <p className="text-sm text-gray-600">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Account Type</p>
                <p className="text-sm text-gray-600">
                  {user?.role === 1
                    ? 'Administrator'
                    : user?.role === 2
                      ? 'Staff Member'
                      : 'Regular User'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-white/80 backdrop-blur-sm border-orange-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Need Help?</CardTitle>
            <CardDescription>If you have questions about your application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              If your application is taking longer than expected or you need to update your
              information, please contact our support team.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pending;
