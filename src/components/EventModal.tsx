'use client';

import { useAuth } from '@/app/context/AuthContext';
import { Event } from '@/app/context/EventsContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, Info, Upload, X } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    eventData: {
      title: string;
      description?: string | null;
      starting_date?: string | null;
      images?: string[];
      created_by?: string | null;
    },
    imageFiles?: File[],
  ) => Promise<void>;
  editingEvent?: Event | null;
}

export function EventModal({ open, onOpenChange, onSubmit, editingEvent }: EventModalProps) {
  const { userId } = useAuth();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    starting_date: string;
    images: string[];
  }>({
    title: '',
    description: '',
    starting_date: '',
    images: [],
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [startingDate, setStartingDate] = useState<Date | undefined>(undefined);
  const [startingTime, setStartingTime] = useState<string>('');

  // Helper: minimum selectable date is today + 3 days (local)
  const getMinEventDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  };

  // Reset form when modal opens/closes or when editingEvent changes
  useEffect(() => {
    if (open) {
      if (editingEvent) {
        console.log('Setting up form for editing event:', editingEvent);
        // Parse and set date/time with local components
        let nextStartingDate = '';
        let nextTime = '';
        let dateObj: Date | undefined = undefined;
        if (editingEvent.starting_date) {
          const d = new Date(editingEvent.starting_date);
          if (!isNaN(d.getTime())) {
            dateObj = d;
            const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
            const yyyy = d.getFullYear();
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            const hh = pad(d.getHours());
            const mi = pad(d.getMinutes());
            nextStartingDate = `${yyyy}-${mm}-${dd}`;
            nextTime = `${hh}:${mi}`;
          }
        }
        setStartingDate(dateObj);
        setStartingTime(nextTime);
        setFormData({
          title: editingEvent.title || '',
          description: editingEvent.description || '',
          starting_date: nextStartingDate && nextTime ? `${nextStartingDate}T${nextTime}` : '',
          images: editingEvent.images || [],
        });
        // Don't set existing images to imagePreviews - they're handled via formData.images
        console.log(
          'Existing event images will be displayed via formData.images:',
          editingEvent.images,
        );
        setImagePreviews([]); // Keep previews empty for new files only
        setImageFiles([]); // Clear files when editing existing event
      } else {
        console.log('Setting up form for new event');
        setFormData({
          title: '',
          description: '',
          starting_date: '',
          images: [],
        });
        setStartingDate(undefined);
        setStartingTime('');
        setImagePreviews([]);
        setImageFiles([]); // Clear files for new event
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

  const handleFileUpload = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError('');

    // Store file and create local preview
    const previewUrl = URL.createObjectURL(file);
    setImageFiles((prev) => [...prev, file]);
    setImagePreviews((prev) => [...prev, previewUrl]);
    setValidationErrors((prev) => ({ ...prev, images: '' }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        handleFileUpload(files[i]);
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeImage = (imageUrl: string) => {
    // Check if it's a new preview (blob URL or recently added)
    const previewIndex = imagePreviews.indexOf(imageUrl);

    if (previewIndex !== -1) {
      // It's a new preview - remove from previews and files
      setImagePreviews((prev) => prev.filter((url) => url !== imageUrl));
      setImageFiles((prev) => prev.filter((_, index) => index !== previewIndex));

      // Clean up blob URL if it's a local preview
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    } else {
      // It's an existing image - remove from formData.images
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((url) => url !== imageUrl),
      }));
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) {
      return;
    }

    // Normalize starting_date to ISO string (UTC) if provided
    let startingISO: string | null = null;
    if (formData.starting_date) {
      const parsed = new Date(formData.starting_date);
      if (!isNaN(parsed.getTime())) {
        startingISO = parsed.toISOString();
      }
    }

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      starting_date: startingISO,
      images: formData.images, // Always send existing images (will be empty array for new events)
      created_by: userId || null,
    };

    // Validate starting_date against minimum
    if (eventData.starting_date) {
      const selected = new Date(eventData.starting_date);
      const minDate = getMinEventDate();
      if (!isNaN(selected.getTime()) && selected < minDate) {
        setValidationErrors((prev) => ({
          ...prev,
          starting_date: `Event date must be at least ${minDate.toLocaleDateString()} or later (min 3 days from today)`,
        }));
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(eventData, imageFiles);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to submit event:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        handleFileUpload(files[i]);
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
            <div className="flex items-center gap-2">
              <Label htmlFor="title">
                Event Title <span className="text-red-500">*</span>
              </Label>
            </div>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="description">Description</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>
                      Provide a clear description with the event&apos;s purpose, activities, target
                      audience, location, and timing. This helps generate better AI suggestions for
                      planning and promotion.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
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

          {/* Starting Date & Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Event Starting Date & Time</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>
                    Schedule your event at least 3 days in advance to allow proper planning and
                    promotion. Choose a date and time that works best for your target audience.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    type="button"
                    className="w-full justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startingDate ? startingDate.toLocaleDateString() : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startingDate}
                    onSelect={(date) => {
                      setStartingDate(date || undefined);
                      if (date) {
                        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                        const y = date.getFullYear();
                        const m = pad(date.getMonth() + 1);
                        const d = pad(date.getDate());
                        const time = startingTime || '00:00';
                        handleInputChange('starting_date', `${y}-${m}-${d}T${time}`);
                        // Clear any previous date validation message
                        if (validationErrors.starting_date) {
                          setValidationErrors((prev) => ({ ...prev, starting_date: '' }));
                        }
                      } else {
                        setStartingTime('');
                        handleInputChange('starting_date', '');
                      }
                    }}
                    disabled={(date) => {
                      if (!date) return false;
                      const minDate = getMinEventDate();
                      // Disable dates before min (today + 3 days)
                      return date < minDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={startingTime}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartingTime(val);
                  if (startingDate && val) {
                    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                    const y = startingDate.getFullYear();
                    const m = pad(startingDate.getMonth() + 1);
                    const d = pad(startingDate.getDate());
                    handleInputChange('starting_date', `${y}-${m}-${d}T${val}`);
                    // Clear any previous date validation message
                    if (validationErrors.starting_date) {
                      setValidationErrors((prev) => ({ ...prev, starting_date: '' }));
                    }
                  } else if (!val) {
                    // If time cleared, clear datetime unless we want date-only
                    handleInputChange('starting_date', '');
                  }
                }}
                className="w-[140px]"
                disabled={!startingDate}
              />
            </div>
            <p className="text-xs text-gray-500">
              Optional: Choose a date and time. Minimum date is{' '}
              {getMinEventDate().toLocaleDateString()} (3 days from today).
            </p>
            {validationErrors.starting_date && (
              <p className="text-xs text-red-600">{validationErrors.starting_date}</p>
            )}
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
            />

            {formData.images.length > 0 || imagePreviews.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {/* Existing images */}
                  {formData.images.map((imageUrl, index) => (
                    <div key={`existing-${imageUrl}-${index}`} className="relative group">
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
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {/* New image previews */}
                  {imagePreviews.map((previewUrl, index) => (
                    <div key={`preview-${previewUrl}-${index}`} className="relative group">
                      <Image
                        src={previewUrl}
                        alt={`New image ${index + 1}`}
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded-lg border border-blue-300"
                        onError={(e) => {
                          console.error('Failed to load preview:', previewUrl);
                          e.currentTarget.src = '/empty.png';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 right-2 h-6 w-6 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={() => removeImage(previewUrl)}
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
                >
                  Choose Images
                </Button>
              </div>
            )}

            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? editingEvent
                  ? 'Updating...'
                  : 'Creating...'
                : editingEvent
                  ? 'Update Event'
                  : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
