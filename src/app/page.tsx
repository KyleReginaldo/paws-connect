'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, PawPrint, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function HomePage() {
  const { userId } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <PawPrint className="h-16 w-16 text-orange-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Welcome to Paws Connect Admin
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find your perfect furry companion, support meaningful causes, and join a community of
            pet lovers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600">
              <Link href={userId ? '/dashboard' : '/auth/signin'}>
                <Heart className="mr-2 h-5 w-5" />
                Get Started
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/fundraising">View Campaigns</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <PawPrint className="h-12 w-12 text-blue-500" />
              </div>
              <CardTitle>Find Pets</CardTitle>
              <CardDescription>
                Browse through adorable pets looking for their forever homes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Heart className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle>Support Causes</CardTitle>
              <CardDescription>
                Help fundraising campaigns for pet care and rescue operations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle>Join Community</CardTitle>
              <CardDescription>
                Connect with fellow pet lovers and make a difference together
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
