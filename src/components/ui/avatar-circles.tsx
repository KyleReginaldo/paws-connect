'use client';

import { cn } from '@/lib/utils';

interface Avatar {
  imageUrl: string;
  profileUrl: string;
}
interface AvatarCirclesProps {
  className?: string;
  numPeople?: number;
  avatarUrls: Avatar[];
}

export const AvatarCircles = ({ numPeople, className, avatarUrls }: AvatarCirclesProps) => {
  return (
    <div className={cn('z-10 flex -space-x-2 rtl:space-x-reverse', className)}>
      {avatarUrls.map((url, index) => (
        <a key={index} href={url.profileUrl} target="_blank" rel="noopener noreferrer">
          <img
            key={index}
            className="h-6 w-6 rounded-full border-2 border-orange-400 dark:border-gray-800 object-cover "
            src={url.imageUrl}
            width={24}
            height={24}
            alt={`Avatar ${index + 1}`}
          />
        </a>
      ))}
      {(numPeople ?? 0) > 0 && (
        <a
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-black text-center text-xs font-medium text-white hover:bg-gray-600 dark:border-gray-800 dark:bg-white dark:text-black"
          href=""
        >
          +{numPeople}
        </a>
      )}
    </div>
  );
};
