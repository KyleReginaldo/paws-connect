'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface HappinessImageDisplayProps {
  happinessImage: string;
  petName: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function HappinessImageDisplay({
  happinessImage,
  petName,
  size = 'sm',
  showLabel = true,
}: HappinessImageDisplayProps) {
  const [showModal, setShowModal] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'md':
        return 'w-16 h-16';
      case 'lg':
        return 'w-24 h-24';
      default:
        return 'w-12 h-12';
    }
  };

  const getHeartSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'md':
        return 'h-4 w-4';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-3 w-3';
    }
  };

  return (
    <>
      <div
        className="relative cursor-pointer transition-transform hover:scale-105"
        onClick={() => setShowModal(true)}
        title={`See how happy ${petName} is in their new home!`}
      >
        <div
          className={`relative ${getSizeClasses()} rounded-lg overflow-hidden border-2 border-green-200 shadow-sm`}
        >
          <Image
            src={happinessImage}
            alt={`Happy ${petName} in their new home`}
            fill
            className="object-cover"
          />
          <div className="absolute top-0 right-0 bg-green-100 rounded-bl-lg px-1">
            <Heart className={`text-red-500 fill-red-500 ${getHeartSize()}`} />
          </div>
        </div>
        {showLabel && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
              Happy & Loved
            </div>
          </div>
        )}
      </div>

      {/* Full Size Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl p-2">
          <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden">
            <Image
              src={happinessImage}
              alt={`Happy ${petName} in their new home`}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                <span className="text-sm font-medium text-gray-800">
                  {petName} is happy & loved! 💕
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
