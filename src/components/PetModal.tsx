'use client';

import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/supabase/supabase';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pet } from '@/config/types/pet';
import { format } from 'date-fns';
import { CalendarIcon, Info, Upload } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface PetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (petData: Omit<Pet, 'id' | 'dateAdded'>) => void;
  editingPet?: Pet | null;
}

export function PetModal({ open, onOpenChange, onSubmit, editingPet }: PetModalProps) {
  const [birthDate, setBirthDate] = useState<Date>();
  const { userId } = useAuth();
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    color?: string;
    breed: string;
    gender: string;
    age: number;
    date_of_birth: string;
    size: string;
    weight: string;
    is_vaccinated: boolean;
    is_spayed_or_neutured: boolean;
    health_status: string;
    good_with: string[];
    is_trained: boolean;
    rescue_address: string;
    description: string;
    special_needs: string;
    added_by: string;
    request_status: string;
    photos: string[];
  }>({
    name: '',
    type: '',
    color: '',
    breed: '',
    gender: '',
    age: 1,
    date_of_birth: '',
    size: '',
    weight: '',
    is_vaccinated: false,
    is_spayed_or_neutured: false,
    health_status: '',
    good_with: [],
    is_trained: false,
    rescue_address: '',
    description: '',
    special_needs: '',
    added_by: userId || '',
    request_status: '',
    photos: [],
  });

  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [lastFailedFile, setLastFailedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [catBreeds, setCatBreeds] = useState<{ name: string; image: string }[]>([]);
  const [dogBreeds, setDogBreeds] = useState<{ name: string; image: string }[]>([]);
  const [breedsLoading, setBreedsLoading] = useState(false);

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    if (!file) {
      return 'No file selected';
    }

    if (file.size === 0) {
      return 'File appears to be empty or corrupted';
    }

    if (file.size > maxSize) {
      return `Image size (${(file.size / 1024 / 1024).toFixed(2)}MB) must be less than 5MB`;
    }

    // Check file type
    const fileType = file.type.toLowerCase();
    if (!allowedTypes.includes(fileType)) {
      return `File type '${file.type}' is not supported. Please upload JPEG, JPG, PNG, or WebP images only.`;
    }

    // Check file extension as backup
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop() || '';
    if (!allowedExtensions.includes(fileExtension)) {
      return `File extension '.${fileExtension}' is not supported. Please use .jpg, .jpeg, .png, or .webp files.`;
    }

    // Check for valid file name
    if (!file.name || file.name.length < 3 || file.name.length > 255) {
      return 'Invalid file name. Please choose a file with a proper name.';
    }

    // Check for suspicious file patterns
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return 'Invalid characters in file name';
    }

    // Basic file corruption check - very small files are likely corrupted
    if (file.size < 100) {
      return 'File is too small and may be corrupted. Please choose a different image.';
    }

    return null;
  };

  // Change this to your actual Supabase bucket name if not 'files'
  const SUPABASE_BUCKET = 'files';

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name.trim()) {
      errors.name = 'Pet name is required';
    }
    if (!formData.type) {
      errors.type = 'Pet type is required';
    }
    if (photosPreviews.length === 0 && (!formData.photos || formData.photos.length === 0)) {
      errors.photos = 'At least one pet photo is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileUpload = async (file: File, retryCount = 0) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      setLastFailedFile(null);
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setLastFailedFile(file);

    try {
      // Method 1: Try using the API route first (better for cross-browser compatibility)
      try {
        const formData = new FormData();
        formData.append('file', file);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch('/api/v1/pets/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Upload failed: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const result = await response.json();

        if (result.url) {
          console.log('Photo uploaded successfully via API:', result.url);
          setPhotosPreviews((prev) => [...prev, result.url]);
          setFormData((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), result.url],
          }));
          setValidationErrors((prev) => ({ ...prev, photos: '' }));
          setLastFailedFile(null);
          setIsUploading(false);

          // Force a small delay to ensure state updates properly
          setTimeout(() => {
            console.log('Photo preview state after upload:', result.url);
          }, 100);

          return;
        } else {
          throw new Error('No URL returned from upload API');
        }
      } catch (apiError) {
        console.warn('API upload failed, trying direct Supabase upload:', apiError);

        // Check if it's a network error
        const isNetworkError =
          apiError instanceof Error &&
          (apiError.name === 'AbortError' ||
            apiError.message.includes('fetch') ||
            apiError.message.includes('network') ||
            apiError.message.includes('timeout'));

        if (isNetworkError && retryCount < 2) {
          // Retry for network errors
          setUploadError(`Network error, retrying... (${retryCount + 1}/3)`);
          setTimeout(() => {
            handleFileUpload(file, retryCount + 1);
          }, 2000);
          return;
        }

        // Method 2: Fallback to direct Supabase upload
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
        const filePath = `pets/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Supabase upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
        const publicUrl = urlData?.publicUrl;

        if (!publicUrl) {
          throw new Error('Failed to get public URL from Supabase');
        }

        console.log('Photo uploaded successfully via Supabase:', publicUrl);
        setPhotosPreviews((prev) => [...prev, publicUrl]);
        setFormData((prev) => ({
          ...prev,
          photos: [...(prev.photos || []), publicUrl],
        }));
        setValidationErrors((prev) => ({ ...prev, photos: '' }));
        setLastFailedFile(null);
      }
    } catch (error) {
      console.error('Photo upload failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (
        retryCount < 2 &&
        (errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('fetch'))
      ) {
        setUploadError(`Upload failed, retrying... (${retryCount + 1}/3)`);
        setTimeout(() => {
          handleFileUpload(file, retryCount + 1);
        }, 2000);
        return;
      }

      setUploadError(
        `Upload failed: ${errorMessage}. Please check your internet connection and try again.`,
      );
    } finally {
      if (retryCount === 0) {
        setIsUploading(false);
      }
    }
  };

  const retryUpload = () => {
    if (lastFailedFile) {
      handleFileUpload(lastFailedFile);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelect triggered', e.target.files);
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log(`Selected ${files.length} files`);
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        console.log(`Uploading file ${i + 1}:`, files[i].name);
        await handleFileUpload(files[i]);
      }
    }
    // Reset input value to allow selecting the same files again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        await handleFileUpload(files[i]);
      }
    }
  };

  const handleDragOver = (_e: React.DragEvent) => {
    _e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (_e: React.DragEvent) => {
    _e.preventDefault();
    setIsDragOver(false);
  };

  const removePhoto = (photoUrl: string) => {
    console.log('Removing photo:', photoUrl);
    setPhotosPreviews((prev) => prev.filter((url) => url !== photoUrl));
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((url) => url !== photoUrl),
    }));
    const updatedPhotos = (formData.photos || []).filter((url) => url !== photoUrl);
    if (updatedPhotos.length === 0) {
      setValidationErrors((prev) => ({ ...prev, photos: '' }));
    }
    setUploadError('');
    setLastFailedFile(null);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetUploadStates = () => {
    setUploadError('');
    setIsUploading(false);
    setLastFailedFile(null);
    setValidationErrors({});
  };

  // Load breed data
  const loadBreedData = async () => {
    setBreedsLoading(true);
    try {
      const [catResponse, dogResponse] = await Promise.all([
        fetch('/cat-breeds.json'),
        fetch('/dog-breeds.json'),
      ]);

      if (catResponse.ok) {
        const catData = await catResponse.json();
        setCatBreeds(catData);
      }

      if (dogResponse.ok) {
        const dogData = await dogResponse.json();
        setDogBreeds(dogData);
      }
    } catch (error) {
      console.error('Failed to load breed data:', error);
    } finally {
      setBreedsLoading(false);
    }
  };

  useEffect(() => {
    console.log(`user in modal: ${userId}`);
    console.log('Modal opened, editingPet:', editingPet);

    // Load breed data when modal opens
    if (open && (catBreeds.length === 0 || dogBreeds.length === 0)) {
      loadBreedData();
    }

    if (editingPet) {
      console.log('Setting up form for editing pet, photos:', editingPet.photos);
      setFormData({
        name: editingPet.name || '',
        type: editingPet.type || '',
        breed: editingPet.breed || '',
        gender: editingPet.gender || '',
        age: editingPet.age && editingPet.age > 0 ? editingPet.age : 1,
        date_of_birth: editingPet.date_of_birth || '',
        size: editingPet.size || '',
        weight: editingPet.weight || '',
        is_vaccinated: editingPet.is_vaccinated || false,
        is_spayed_or_neutured: editingPet.is_spayed_or_neutured || false,
        health_status: editingPet.health_status || '',
        good_with: editingPet.good_with || [],
        is_trained: editingPet.is_trained || false,
        rescue_address: editingPet.rescue_address || '',
        description: editingPet.description || '',
        special_needs: editingPet.special_needs || '',
        added_by: editingPet.added_by || userId || '',
        request_status: editingPet.request_status || '',
        photos: editingPet.photos || [],
      });
      setBirthDate(editingPet.date_of_birth ? new Date(editingPet.date_of_birth) : undefined);
      const photoUrls = editingPet.photos || [];
      console.log('Setting photos previews to:', photoUrls);
      setPhotosPreviews(photoUrls);
    } else {
      console.log('Setting up form for new pet');
      // Reset form for new pet
      setFormData({
        name: '',
        type: '',
        color: '',
        breed: '',
        gender: '',
        age: 1,
        date_of_birth: '',
        size: '',
        weight: '',
        is_vaccinated: false,
        is_spayed_or_neutured: false,
        health_status: '',
        good_with: [],
        is_trained: false,
        rescue_address: '',
        description: '',
        special_needs: '',
        added_by: userId || '',
        request_status: '',
        photos: [],
      });
      setBirthDate(undefined);
      setPhotosPreviews([]);
    }
    resetUploadStates();
    // Load draft from session storage if exists (only for new pet)
    try {
      if (!editingPet) {
        const draft = sessionStorage.getItem('pet_form_draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // ignore
    }
  }, [editingPet, open, userId, catBreeds.length, dogBreeds.length]);

  // Persist draft to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('pet_form_draft', JSON.stringify(formData));
    } catch {
      // ignore storage errors
    }
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission while uploading
    if (isUploading) {
      setUploadError('Please wait for the photo upload to complete before submitting.');
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    // Ensure all required fields are present and normalized
    const now = new Date();
    const petData = {
      name: formData.name,
      type: formData.type,
      breed: formData.breed,
      gender: formData.gender,
      age: formData.age || 1,
      date_of_birth: birthDate ? birthDate.toISOString().split('T')[0] : formData.date_of_birth,
      size: formData.size,
      weight: formData.weight
        ? formData.weight.endsWith('kg')
          ? formData.weight
          : `${formData.weight.replace(/[^\d.]/g, '')}kg`
        : '1kg',
      is_vaccinated: formData.is_vaccinated,
      is_spayed_or_neutured: formData.is_spayed_or_neutured,
      health_status: formData.health_status || '',
      good_with: Array.isArray(formData.good_with) ? formData.good_with : [],
      is_trained: formData.is_trained,
      rescue_address: formData.rescue_address || '',
      description: formData.description || '',
      special_needs: formData.special_needs || '',
      added_by: formData.added_by || userId || '',
      request_status: formData.request_status || 'pending',
      created_at: now.toISOString(),
      photos: photosPreviews.length > 0 ? photosPreviews : formData.photos || [],
    };
    onSubmit(petData);
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    if (field === 'photo') {
      console.log('Updating photo field:', value);
    }

    // If changing pet type, clear color and breed if they're not valid for the new type
    if (field === 'type' && typeof value === 'string') {
      const dogColors = [
        'Black',
        'Brown',
        'White',
        'Golden',
        'Gray',
        'Tan',
        'Brindle',
        'Cream',
        'Red',
        'Blue',
        'Merle',
        'Black/White',
        'Brown/White',
        'Golden/White',
        'Gray/White',
        'Tri-color',
        'Mixed',
      ];
      const catColors = [
        'Black',
        'White',
        'Gray',
        'Orange',
        'Tabby',
        'Calico',
        'Tortoiseshell',
        'Tuxedo',
        'Siamese',
        'Russian Blue',
        'Silver',
        'Cream',
        'Brown',
        'Black/White',
        'Orange/White',
        'Gray/White',
        'Mixed',
      ];

      const currentColor = formData.color;
      const currentBreed = formData.breed;
      const newType = value;

      // Check if current breed is valid for new type
      let shouldClearBreed = false;
      if (currentBreed) {
        if (newType === 'Dog' && !dogBreeds.some((breed) => breed.name === currentBreed)) {
          shouldClearBreed = true;
        } else if (newType === 'Cat' && !catBreeds.some((breed) => breed.name === currentBreed)) {
          shouldClearBreed = true;
        }
      }

      // Clear color if it's not valid for the new type
      const shouldClearColor =
        currentColor &&
        ((newType === 'Dog' && !dogColors.includes(currentColor)) ||
          (newType === 'Cat' && !catColors.includes(currentColor)));

      setFormData((prev) => ({
        ...prev,
        type: newType,
        ...(shouldClearColor && { color: '' }),
        ...(shouldClearBreed && { breed: '' }),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPet ? 'Edit Pet' : 'Add New Pet'}</DialogTitle>
          <DialogDescription>
            {editingPet
              ? "Update your pet's information."
              : "Enter your pet's information to add them to your profile."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Important fields first: Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Buddy"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className={validationErrors.name ? 'border-red-500' : ''}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
                required
              >
                <SelectTrigger className={validationErrors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.type && (
                <p className="text-sm text-red-500">{validationErrors.type}</p>
              )}
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              {formData.type && !breedsLoading ? (
                <Select
                  value={formData.breed}
                  onValueChange={(value) => handleInputChange('breed', value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        formData.type === 'Dog'
                          ? 'Select dog breed...'
                          : formData.type === 'Cat'
                            ? 'Select cat breed...'
                            : 'Select pet type first'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {formData.type === 'Dog'
                      ? dogBreeds
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((breed) => (
                            <SelectItem
                              key={breed.name}
                              value={breed.name}
                              className="flex items-center gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={breed.image}
                                  alt={breed.name}
                                  className="h-6 w-6 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <span>{breed.name}</span>
                              </div>
                            </SelectItem>
                          ))
                      : formData.type === 'Cat'
                        ? catBreeds
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((breed) => (
                              <SelectItem
                                key={breed.name}
                                value={breed.name}
                                className="flex items-center gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <img
                                    src={breed.image}
                                    alt={breed.name}
                                    className="h-6 w-6 rounded object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <span>{breed.name}</span>
                                </div>
                              </SelectItem>
                            ))
                        : null}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="breed"
                  placeholder={
                    breedsLoading
                      ? 'Loading breeds...'
                      : !formData.type
                        ? 'Please select pet type first'
                        : 'Select breed'
                  }
                  value={formData.breed}
                  onChange={(e) => handleInputChange('breed', e.target.value)}
                  disabled
                  className="bg-muted"
                />
              )}
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={1}
                step={1}
                value={formData.age}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const val = Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 1;
                  handleInputChange('age', val);
                }}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color - depends on pet type */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              {formData.type ? (
                <Select
                  value={formData.color}
                  onValueChange={(value) => handleInputChange('color', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type === 'Dog' ? (
                      <>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="Brown">Brown</SelectItem>
                        <SelectItem value="White">White</SelectItem>
                        <SelectItem value="Golden">Golden</SelectItem>
                        <SelectItem value="Gray">Gray</SelectItem>
                        <SelectItem value="Tan">Tan</SelectItem>
                        <SelectItem value="Brindle">Brindle</SelectItem>
                        <SelectItem value="Cream">Cream</SelectItem>
                        <SelectItem value="Red">Red</SelectItem>
                        <SelectItem value="Blue">Blue</SelectItem>
                        <SelectItem value="Merle">Merle</SelectItem>
                        <SelectItem value="Black/White">Black/White</SelectItem>
                        <SelectItem value="Brown/White">Brown/White</SelectItem>
                        <SelectItem value="Golden/White">Golden/White</SelectItem>
                        <SelectItem value="Gray/White">Gray/White</SelectItem>
                        <SelectItem value="Tri-color">Tri-color</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                      </>
                    ) : formData.type === 'Cat' ? (
                      <>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="White">White</SelectItem>
                        <SelectItem value="Gray">Gray</SelectItem>
                        <SelectItem value="Orange">Orange</SelectItem>
                        <SelectItem value="Tabby">Tabby</SelectItem>
                        <SelectItem value="Calico">Calico</SelectItem>
                        <SelectItem value="Tortoiseshell">Tortoiseshell</SelectItem>
                        <SelectItem value="Tuxedo">Tuxedo</SelectItem>
                        <SelectItem value="Siamese">Siamese</SelectItem>
                        <SelectItem value="Russian Blue">Russian Blue</SelectItem>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Cream">Cream</SelectItem>
                        <SelectItem value="Brown">Brown</SelectItem>
                        <SelectItem value="Black/White">Black/White</SelectItem>
                        <SelectItem value="Orange/White">Orange/White</SelectItem>
                        <SelectItem value="Gray/White">Gray/White</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                      </>
                    ) : null}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="color"
                  placeholder="Please select pet type first"
                  value=""
                  disabled
                  className="bg-muted"
                />
              )}
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select
                value={formData.size}
                onValueChange={(value) => handleInputChange('size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="giant">Giant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <div className="flex">
                <Input
                  id="weight"
                  placeholder="e.g., 25"
                  value={formData.weight.replace(/kg$/, '')} // Display without kg suffix
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^\d.]/g, ''); // Only allow numbers and decimal
                    handleInputChange('weight', numericValue);
                  }}
                  className="rounded-r-none"
                />
                <div className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                  kg
                </div>
              </div>
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Health Status */}
            <div className="space-y-2">
              <Label htmlFor="health_status">Health Status</Label>
              <Select
                value={formData.health_status}
                onValueChange={(value) => handleInputChange('health_status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select health status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Healthy and Active">Healthy and Active</SelectItem>
                  <SelectItem value="Minor Condition">Minor Condition</SelectItem>
                  <SelectItem value="Recovering/Under Treatment">
                    Recovering/Under Treatment
                  </SelectItem>
                  <SelectItem value="Special Care Needed">Special Care Needed</SelectItem>
                  <SelectItem value="Injured">Injured</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Good With */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 relative">
                <Label>Good With</Label>
                <span
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="relative cursor-pointer"
                >
                  <Info size={16} />

                  {showTooltip && (
                    <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      This tells adopters
                      <br />
                      what your pet is comfortable around.
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {['dogs', 'cats', 'children', 'other'].map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.good_with.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('good_with', [...formData.good_with, option]);
                        } else {
                          handleInputChange(
                            'good_with',
                            formData.good_with.filter((v) => v !== option),
                          );
                        }
                      }}
                    />
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/* Spayed/Neutered */}
            <div className="space-y-2">
              <Label htmlFor="is_spayed_or_neutured">Spayed/Neutered</Label>
              <Select
                value={formData.is_spayed_or_neutured ? 'yes' : 'no'}
                onValueChange={(value) =>
                  handleInputChange('is_spayed_or_neutured', value === 'yes')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trained */}
            <div className="space-y-2">
              <Label htmlFor="is_trained">Potty-train</Label>
              <Select
                value={formData.is_trained ? 'yes' : 'no'}
                onValueChange={(value) => handleInputChange('is_trained', value === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rescue Address */}
            <div className="space-y-2">
              <Label htmlFor="rescue_address">Rescue Address</Label>
              <Input
                id="rescue_address"
                placeholder="e.g., 123 Main St, City, State"
                value={formData.rescue_address}
                onChange={(e) => handleInputChange('rescue_address', e.target.value)}
              />
            </div>

            {/* Special Needs */}
            <div className="space-y-2">
              <Label htmlFor="special_needs">Special Needs</Label>
              <Input
                id="special_needs"
                placeholder="e.g., Medication, Diet, etc."
                value={formData.special_needs}
                onChange={(e) => handleInputChange('special_needs', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="request_status">Request Status</Label>
              <Select
                value={formData.request_status}
                onValueChange={(value) => handleInputChange('request_status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select request status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Pet Photos *</Label>
            {/* Hidden file input - always present */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="border-2 border-dashed border-blue-500 bg-blue-50 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-sm text-blue-700">Uploading photos...</p>
                  <p className="text-xs text-blue-600">Please wait, this may take a moment</p>
                </div>
              </div>
            ) : photosPreviews.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-0">
                  {photosPreviews.map((photoUrl, index) => (
                    <div
                      key={`${photoUrl}-${index}`}
                      className="relative group w-[128px] h-[128px] m-0 p-0"
                    >
                      <Image
                        src={photoUrl}
                        alt={`Pet preview ${index + 1}`}
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded-lg border m-0"
                        onError={(e) => {
                          console.error('Failed to load image:', photoUrl);
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = '/empty_pet.png';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', photoUrl);
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 left-0 h-6 w-6 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={() => removePhoto(photoUrl)}
                        disabled={isUploading}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Add More Photos clicked');
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                >
                  Add More Photos
                </Button>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : validationErrors.photos || uploadError
                      ? 'border-red-500 bg-red-50'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop photos here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Supports JPEG, JPG, PNG, WebP up to 5MB each. Select multiple files at once.
                </p>
                <div className="relative flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Choose Files'}
                  </Button>
                </div>
              </div>
            )}
            {uploadError && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Upload Error</p>
                  <p className="text-sm text-red-700">{uploadError}</p>
                  {lastFailedFile && !isUploading && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={retryUpload}
                        className="bg-white hover:bg-gray-50"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {validationErrors.photos && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Required Field</p>
                  <p className="text-sm text-red-700">{validationErrors.photos}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description/Notes</Label>
            <Textarea
              id="description"
              placeholder="Any additional information about your pet..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading}
              className={isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isUploading ? 'Uploading Photo...' : editingPet ? 'Update Pet' : 'Add Pet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
