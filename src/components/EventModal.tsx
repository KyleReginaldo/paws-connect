'use client';

import { useAuth } from '@/app/context/AuthContext';
import { Event } from '@/app/context/EventsContext';
import { supabase } from '@/app/supabase/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (eventData: {
    title: string;
    description?: string | null;
    images?: string[];
    created_by?: string | null;
  }) => void;
  editingEvent?: Event | null;
}

export function EventModal({ open, onOpenChange, onSubmit, editingEvent }: EventModalProps) {
  const { userId } = useAuth();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    images: string[];
  }>({
    title: '',
    description: '',
    images: [],
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes or when editingEvent changes
  useEffect(() => {
    if (open) {
      if (editingEvent) {
        console.log('Setting up form for editing event:', editingEvent);
        setFormData({
          title: editingEvent.title || '',
          description: editingEvent.description || '',
          images: editingEvent.images || [],
        });
      } else {
        console.log('Setting up form for new event');
        setFormData({
          title: '',
          description: '',
          images: [],
        });
      }
      setValidationErrors({});
      setUploadError('');
    }
  }, [open, editingEvent]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB for events (larger than pets)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      return 'Please upload a valid image file (JPEG, PNG, WebP, GIF)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    if (file.size < 1024) {
      // Less than 1KB
      return 'File size is too small. Please upload a valid image.';
    }

    return null;
  };

  const handleFileUpload = async (file: File, retryCount = 0) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      // Method 1: Direct Supabase upload
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `events/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('files').upload(filePath, file, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('files').getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL from Supabase');
      }

      console.log('Image uploaded successfully:', publicUrl);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, publicUrl],
      }));
      setValidationErrors((prev) => ({ ...prev, images: '' }));
    } catch (error) {
      console.error('Direct upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // Try API endpoint as fallback
      try {
        console.log('Trying API endpoint fallback...');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/v1/events/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API upload failed');
        }

        const result = await response.json();
        console.log('API upload successful:', result.url);

        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, result.url],
        }));
        setValidationErrors((prev) => ({ ...prev, images: '' }));
      } catch (apiError) {
        console.error('API upload error:', apiError);

        // Retry logic for network errors
        const isNetworkError =
          errorMessage.includes('network') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('timeout');

        if (isNetworkError && retryCount < 2) {
          setUploadError(`Network error, retrying... (${retryCount + 1}/3)`);
          setTimeout(() => {
            handleFileUpload(file, retryCount + 1);
          }, 2000);
          return;
        }

        // Provide more specific error messages
        if (errorMessage.includes('bucket') || errorMessage.includes('storage')) {
          setUploadError('Storage configuration error. Please try again.');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setUploadError('Network error. Please check your connection and try again.');
        } else {
          setUploadError(`Upload failed: ${errorMessage}`);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await handleFileUpload(files[i]);
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeImage = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((url) => url !== imageUrl),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Event title is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if content is sufficient for good AI suggestions
  const isContentSufficientForAI = () => {
    const titleLength = formData.title.trim().length;
    const descriptionLength = formData.description.trim().length;

    return titleLength >= 10 && descriptionLength >= 50;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      images: formData.images,
      created_by: userId || null,
    };

    onSubmit(eventData);
    onOpenChange(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await handleFileUpload(files[i]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Community Pet Adoption Drive, Veterinary Health Camp, Pet Training Workshop"
              className={validationErrors.title ? 'border-red-500' : ''}
            />
            {validationErrors.title && (
              <p className="text-sm text-red-500">{validationErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <span className="text-xs text-gray-500">
                {formData.description.length}/50+ characters{' '}
                {formData.description.length >= 50 ? '✅' : ''}
              </span>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the event purpose, activities, target audience, location, and timing. Include any special requirements or goals to help generate better AI suggestions."
              rows={4}
            />
          </div>

          {/* AI Suggestion Reminder */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🤖</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">AI Suggestion Tips</h4>
                <p className="text-sm text-blue-800 mb-3">
                  To generate helpful AI suggestions, please provide clear and detailed information:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Title:</strong> Use specific, descriptive names (e.g., &quot;Community
                    Pet Adoption Drive&quot; vs &quot;Event&quot;)
                  </li>
                  <li>
                    <strong>Description:</strong> Include purpose, target audience, activities, and
                    goals
                  </li>
                  <li>
                    <strong>Context:</strong> Mention location, timing, and any special requirements
                  </li>
                </ul>
                <p className="text-xs text-blue-600 mt-2 italic">
                  💡 Better content = more relevant AI suggestions for event planning and promotion!
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Content Warning/Success */}
          {!isContentSufficientForAI() && (formData.title || formData.description) ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-center space-x-2">
                <span className="text-amber-600">⚠️</span>
                <div>
                  <p className="text-sm text-amber-800 font-medium">Consider adding more details</p>
                  <p className="text-xs text-amber-700">
                    {formData.title.trim().length < 10 &&
                      'Title should be more descriptive (10+ characters). '}
                    {formData.description.trim().length < 50 &&
                      'Add more description details (50+ characters) for better AI suggestions.'}
                  </p>
                </div>
              </div>
            </div>
          ) : isContentSufficientForAI() ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <div>
                  <p className="text-sm text-green-800 font-medium">
                    Great! Content looks good for AI suggestions
                  </p>
                  <p className="text-xs text-green-700">
                    Your event details are comprehensive enough to generate helpful AI suggestions.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Images Upload */}
          <div className="space-y-2">
            <Label>Event Images</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="border-2 border-dashed border-blue-500 bg-blue-50 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-sm text-blue-700">Uploading images...</p>
                </div>
              </div>
            ) : formData.images.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {formData.images.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="relative group">
                      <Image
                        src={imageUrl}
                        alt={`Event image ${index + 1}`}
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          console.error('Failed to load image:', imageUrl);
                          e.currentTarget.src = '/empty.png';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 right-2 h-6 w-6 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={() => removeImage(imageUrl)}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Add More Images
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center transition-colors border-muted-foreground/25 hover:border-muted-foreground/50"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop images here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Supports JPEG, PNG, WebP, GIF up to 10MB each
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Choose Images
                </Button>
              </div>
            )}

            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
