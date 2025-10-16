'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { transformUrlForLocalhost } from '@/lib/url-utils';
import { Download, X } from 'lucide-react';
import Image from 'next/image';

interface PhotoViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string;
  petName: string;
}

export function PhotoViewer({ open, onOpenChange, photoUrl, petName }: PhotoViewerProps) {
  const transformedPhotoUrl = transformUrlForLocalhost(photoUrl);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = transformedPhotoUrl;
    link.download = `${petName}-photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogTitle className="sr-only">{petName} photo</DialogTitle>
        <div className="relative">
          <Image
            src={transformedPhotoUrl || '/placeholder.svg'}
            alt={`${petName}'s photo`}
            width={800}
            height={600}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="bg-black/50 hover:bg-black/70 text-white"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
