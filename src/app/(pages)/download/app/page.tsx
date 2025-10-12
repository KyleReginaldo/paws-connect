'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DownloadCloud } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import playstore from '../../../../../public/playstore.png';

export default function AppDownloadPage() {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-2xl">
            <CardContent className="p-8 text-center space-y-6">
              {/* Icon / Logo */}
              <div className="flex justify-center">
                <Image src={playstore} alt={'logo'} height={100} />
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-gray-800">Get Paws Connect</h1>
                <p className="text-gray-600 text-base">
                  Access the full Paws Connect experience on your mobile device. Track donations,
                  adopt pets, and stay connected with the community anytime, anywhere.
                </p>
              </div>

              {/* Download Button */}
              <div className="flex justify-center pt-4">
                <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-800">
                  <Link
                    href="https://drive.google.com/drive/folders/1ut3xeCHur6U1067Q8eV4WAzypl3MeBic?usp=sharing"
                    target="_blank"
                  >
                    <DownloadCloud className="mr-2 h-5 w-5" />
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
      </body>
    </html>
  );
}
