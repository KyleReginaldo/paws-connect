'use client';

import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notification';
import { Camera, CheckCircle, Heart, Upload, X } from 'lucide-react';
import Image from 'next/image';
import React, { useRef, useState } from 'react';

interface HappinessImageUploadProps {
  adoptionId: number;
  currentImage?: string | null;
  isAdopter: boolean;
  adoptionStatus: string;
  petName?: string;
  onImageUploaded?: (imageUrl: string) => void;
}

export function HappinessImageUpload({
  adoptionId,
  currentImage,
  isAdopter,
  adoptionStatus,
  petName = 'your pet',
  onImageUploaded,
}: HappinessImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string>(currentImage || '');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useNotifications();
  const { userId } = useAuth();

  // Only allow upload if user is the adopter and adoption is approved
  const canUpload = isAdopter && adoptionStatus === 'APPROVED';

  const validateFile = (file: File): string | null => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only image files (JPEG, PNG, GIF, WebP) are allowed';
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      // Upload the image
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/v1/adoption/happiness-image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.url;

      // Update the adoption record with the image URL
      const updateResponse = await fetch(`/api/v1/adoption/${adoptionId}/happiness-image`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify({ happiness_image: imageUrl }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update adoption record');
      }

      setPreviewImage(imageUrl);
      setShowUploadDialog(false);
      success(
        'Happiness image uploaded successfully! Others can now see how happy your pet is! 🎉',
      );
      onImageUploaded?.(imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError((error as Error).message);
      showError('Failed to upload happiness image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Don't render anything if the adoption isn't approved
  if (adoptionStatus !== 'APPROVED') {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-red-500" />
          Happiness Gallery
        </CardTitle>
        <CardDescription>
          {previewImage
            ? `See how happy ${petName} is in their new home!`
            : canUpload
              ? `Share a photo showing how happy ${petName} is in their new home`
              : `The adopter can share photos showing how happy ${petName} is`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {previewImage ? (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden">
              <Image
                src={previewImage}
                alt={`Happy ${petName} in their new home`}
                width={400}
                height={300}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-2 right-2">
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Happy & Loved
                </div>
              </div>
            </div>
            {canUpload && (
              <Button
                onClick={() => setShowUploadDialog(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Update Photo
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            {canUpload ? (
              <div className="space-y-4">
                <div className="bg-orange-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Camera className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Share the joy!</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload a photo to show everyone how happy {petName} is in their new home
                  </p>
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Happiness Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No happiness photo shared yet</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Upload Happiness Photo
            </DialogTitle>
            <DialogDescription>
              Share a photo showing how happy {petName} is in their new home. This will be visible
              to everyone!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <X className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver
                  ? 'border-orange-500 bg-orange-50'
                  : uploadError
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isUploading ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="text-sm text-orange-700">Uploading your happiness photo...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop a photo here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Supports JPEG, PNG, GIF, WebP up to 10MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Choose Photo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                className="flex-1"
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
