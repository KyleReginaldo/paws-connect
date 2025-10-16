'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import community from '../../public/community.png';
import fund from '../../public/fund.png';
import pawslogo from '../../public/pawsconnectlogo.ico';
import pet from '../../public/pet_management.png';
import { useAuth } from './context/AuthContext';

export default function HomePage() {
  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== 'undefined') {
      OneSignal.init({
        appId: '323cc2fb-7bab-418b-954e-a578788499bd',
        safari_web_id: 'web.onesignal.auto.34f3144b-3497-4c5c-a43c-a5d9eb9bdd56',
        autoRegister: true,
        welcomeNotification: {
          title: 'Welcome to Paws Connect!',
          message: 'Thank you for enabling notifications.',
        },
      });
    }
  }, []);
  const { userId } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Image
              src={pawslogo}
              alt="Paws Connect Logo"
              width={80}
              height={50}
              className="object-contain rounded-[8px]"
            />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">
            Welcome to Paws Connect Admin
          </h1>
          <p className="text-base text-gray-600 mb-8 max-w-2xl mx-auto">
            Manage pet adoption listings, oversee fundraising campaigns, and monitor community
            activity efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600">
              <Link href={userId ? '/dashboard' : '/auth/signin'}>Go to Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Admin Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Image
                  src={pet}
                  alt="Pet Management"
                  width={120}
                  height={80}
                  className="object-contain"
                />
              </div>
              <CardTitle>Pet Management</CardTitle>
              <CardDescription>
                Add, edit, or remove pet listings, update adoption status, and manage pet profiles.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Image
                  src={fund}
                  alt="Fundraising Oversight"
                  width={120}
                  height={80}
                  className="object-contain"
                />
              </div>
              <CardTitle>Fundraising Oversight</CardTitle>
              <CardDescription>
                Monitor active campaigns, approve donations, and track fundraising progress in
                real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Image
                  src={community}
                  alt="Community Management"
                  width={120}
                  height={80}
                  className="object-contain"
                />
              </div>
              <CardTitle>User & Community</CardTitle>
              <CardDescription>
                Manage user accounts, monitor community interactions, and resolve issues
                efficiently.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
