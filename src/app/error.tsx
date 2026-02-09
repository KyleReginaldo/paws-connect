'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import android from '../../public/android.png';
import playstore from '../../public/playstore.png';

export default function AppDownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon / Logo */}
          <div className="flex justify-center">
            <Image src={playstore} alt={'logo'} height={100} />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-800">Get PawsConnect</h1>
            <p className="text-gray-600 text-lg">
              Access the full PawsConnect experience on your mobile device. Track donations, adopt
              pets, and stay connected with the community anytime, anywhere.
            </p>
          </div>

          {/* Download Button */}
          <div className="flex justify-center pt-4">
            <Button asChild size="lg" className="bg-black hover:bg-orange-800">
              <Link
                href="https://drive.google.com/file/d/1H2GJSQmOKMTc6OuyWEbrkrUkmjUITSCj/view?usp=sharing"
                target="_blank"
              >
                <Image
                  src={android}
                  alt="Android Logo"
                  color="white"
                  className="inline-block mr-2 text-white"
                  height={20}
                  width={20}
                />{' '}
                Download the App
              </Link>
            </Button>
          </div>

          {/* Footer / Note */}
          <div className="pt-6 border-t">
            <p className="text-sm text-gray-500">Available on Android. Free to download.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
