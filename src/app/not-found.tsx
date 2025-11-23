'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Heart, PawPrint, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  const downloadUrl =
    'https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/apk/pawsconnect/v1/pawsconnect.apk'; // You can replace this with your actual app download link

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated Paw Prints */}
        <div className="relative">
          <div className="flex justify-center space-x-4 mb-6">
            <PawPrint
              className="h-12 w-12 text-orange-400 animate-bounce"
              style={{ animationDelay: '0s' }}
            />
            <PawPrint
              className="h-16 w-16 text-blue-400 animate-bounce"
              style={{ animationDelay: '0.2s' }}
            />
            <PawPrint
              className="h-12 w-12 text-orange-400 animate-bounce"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            {/* 404 Message */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-gray-800">404</h1>
              <h2 className="text-2xl font-semibold text-gray-700">
                Oops! This page went for a walk
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                The page you&apos;re looking for seems to have wandered off, just like a curious
                pet. But don&apos;t worry – our mobile app has everything you need to connect with
                adorable pets!
              </p>
            </div>

            {/* App Download Section */}
            <div className="bg-gradient-to-r from-orange-100 to-blue-100 rounded-xl p-6 space-y-4">
              <div className="flex justify-center">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-8 w-8 text-blue-600" />
                  <Heart className="h-6 w-6 text-red-500 animate-pulse" />
                  <PawPrint className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800">Get the Paws Connect App</h3>
              <p className="text-gray-600 text-sm">
                Find your perfect furry companion, donate to causes you care about, and stay
                connected with our pet community – all from your phone!
              </p>

              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Browse adoptable pets</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Support fundraising campaigns</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Connect with other pet lovers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Track your impact</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5" />
                  Download App Now
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 px-8 py-3 rounded-full transition-all duration-300"
              >
                <Link href="/">
                  <PawPrint className="mr-2 h-5 w-5" />
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <div className="flex justify-center space-x-8 text-gray-400">
          <div className="text-4xl animate-pulse">🐕</div>
          <div className="text-4xl animate-pulse" style={{ animationDelay: '1s' }}>
            🐱
          </div>
          <div className="text-4xl animate-pulse" style={{ animationDelay: '2s' }}>
            🐰
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-gray-500 text-sm">
          Lost but not forgotten – every pet deserves a loving home 💕
        </p>
      </div>
    </div>
  );
}
