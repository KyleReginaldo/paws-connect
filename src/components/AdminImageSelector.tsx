'use client';

import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/supabase/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import { useRef, useState } from 'react';

interface AdminImageSelectorProps {
  currentImage?: string;
  onImageSelect: (imageUrl: string) => void;
  userInitials: string;
}

export function AdminImageSelector({
  currentImage,
  onImageSelect,
  userInitials,
}: AdminImageSelectorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'admin-profiles');

      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      console.log('Upload response status:', response);

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      // Immediately update the profile image
      console.log('Uploaded image URL:', data.url);
      console.log('userId:', userId);
      onImageSelect(data.url);
      if (userId) {
        await supabase.from('users').update({ profile_image_link: data.url }).eq('id', userId);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />
      <Avatar className="size-20 border-2 border-gray-200 group-hover:border-orange-300 transition-colors">
        {currentImage ? (
          <AvatarImage src={currentImage} alt="Profile" className="object-cover" />
        ) : (
          <AvatarFallback className="bg-orange-100 text-orange-700 text-lg font-semibold">
            {userInitials}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
        {isUploading ? (
          <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
        ) : (
          <Camera className="h-6 w-6 text-white" />
        )}
      </div>
    </div>
  );
}
