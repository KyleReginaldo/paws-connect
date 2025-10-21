'use client';

import { useAuth } from '@/app/context/AuthContext';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pet } from '@/config/types/pet';
import { HelpCircle, Info, Upload } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

// ---- Age helper functions (module scope for stable references) ----
const calculateAgeFromBirth = (birthDate: string): number => {
  if (!birthDate) return 0;
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) return 0;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  } catch {
    return 0;
  }
};

const getAgeInMonths = (birthDate: string): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  if (isNaN(birth.getTime())) return 0;
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months += today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
};

export const getAgeLabel = (birthDate: string, fallbackAge?: number | string | null): string => {
  if (birthDate) {
    const years = calculateAgeFromBirth(birthDate);
    if (years >= 1) {
      return `${years} year${years === 1 ? '' : 's'} old`;
    }
    const months = getAgeInMonths(birthDate);
    return `${months} month${months === 1 ? '' : 's'} old`;
  }
  if (typeof fallbackAge === 'number') {
    return `${fallbackAge} year${fallbackAge === 1 ? '' : 's'} old`;
  }
  if (typeof fallbackAge === 'string') return fallbackAge;
  return '';
};

const validateAgeAndBirth = (
  ageLabel: string,
  birthDate: string,
): { isValid: boolean; message?: string } => {
  if (!birthDate) {
    return { isValid: true }; // No validation needed if no birth date
  }

  const calculatedAge = calculateAgeFromBirth(birthDate);
  const expectedLabel = getAgeLabel(birthDate);
  const normalized = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  if (normalized(ageLabel) !== normalized(expectedLabel)) {
    return {
      isValid: false,
      message: `Age should be ${calculatedAge} based on date of birth`,
    };
  }

  return { isValid: true };
};

interface PetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (petData: Omit<Pet, 'id' | 'created_at'>, photoFiles: File[]) => Promise<void>;
  editingPet?: Pet | null;
}

export function PetModal({ open, onOpenChange, onSubmit, editingPet }: PetModalProps) {
  const [birthDate, setBirthDate] = useState<Date>();
  const { userId } = useAuth();
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    color: string;
    breed: string;
    gender: string;
    age: string;
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
    age: '',
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

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [ageWarning, setAgeWarning] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Supabase bucket name is 'paws-connect' - no longer needed as variable

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Required fields validation (name no longer validated here)
    if (!formData.type) {
      errors.type = 'Pet type is required';
    }
    if (
      photoFiles.length === 0 &&
      (!editingPet || !editingPet.photos || editingPet.photos.length === 0)
    ) {
      errors.photos = 'At least one pet photo is required';
    }

    // Age and date of birth validation (soft warning – does not block submission)
    if (formData.date_of_birth && formData.age !== undefined) {
      const validation = validateAgeAndBirth(formData.age, formData.date_of_birth);
      if (!validation.isValid && validation.message) {
        setAgeWarning(validation.message);
      } else {
        setAgeWarning('');
      }
    } else {
      setAgeWarning('');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
    setPhotoFiles((prev) => [...prev, file]);
    setPhotosPreviews((prev) => [...prev, previewUrl]);
    setValidationErrors((prev) => ({ ...prev, photos: '' }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Store files locally
      for (let i = 0; i < files.length; i++) {
        handleFileUpload(files[i]);
      }
    }
    // Reset input value to allow selecting the same files again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Store files locally
      for (let i = 0; i < files.length; i++) {
        handleFileUpload(files[i]);
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
    // Check if it's a new preview (blob URL or recently added)
    const previewIndex = photosPreviews.indexOf(photoUrl);

    if (previewIndex !== -1) {
      // It's a new preview - remove from previews and files
      setPhotosPreviews((prev) => prev.filter((url) => url !== photoUrl));
      setPhotoFiles((prev) => prev.filter((_, index) => index !== previewIndex));

      // Clean up blob URL if it's a local preview
      if (photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoUrl);
      }
    } else {
      // It's an existing photo - remove from formData.photos
      setFormData((prev) => ({
        ...prev,
        photos: (prev.photos || []).filter((url) => url !== photoUrl),
      }));
    }

    // Clear validation error if no photos remain
    const remainingExisting = formData.photos?.filter((url) => url !== photoUrl) || [];
    const remainingPreviews = photosPreviews.filter((url) => url !== photoUrl);
    if (remainingExisting.length === 0 && remainingPreviews.length === 0) {
      setValidationErrors((prev) => ({ ...prev, photos: '' }));
    }
    setUploadError('');

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetUploadStates = () => {
    setUploadError('');
    setValidationErrors({});
    setIsSubmitting(false);
  };

  // Calculate size based on weight and pet type
  const calculateSizeFromWeight = (weight: string, petType: string): string => {
    // Extract numeric value from weight string
    const numericWeight = parseFloat(weight.replace(/[^\d.]/g, ''));

    if (isNaN(numericWeight)) {
      return ''; // Return empty if weight is not a valid number
    }

    if (petType === 'Dog') {
      if (numericWeight >= 5 && numericWeight <= 10) {
        return 'small';
      } else if (numericWeight >= 11 && numericWeight <= 25) {
        return 'medium';
      } else if (numericWeight >= 26 && numericWeight <= 45) {
        return 'large';
      } else if (numericWeight >= 46) {
        return 'giant';
      }
    } else if (petType === 'Cat') {
      if (numericWeight >= 1.8 && numericWeight <= 4.5) {
        return 'small';
      } else if (numericWeight >= 4.6 && numericWeight <= 6.8) {
        return 'medium';
      } else if (numericWeight >= 6.9) {
        // 6.8+ for cats
        return 'large';
      }
    }

    return ''; // Return empty if weight doesn't match any range
  };

  // Get minimum weight for a size category based on pet type
  const getMinWeightForSize = (size: string, petType: string): string => {
    if (petType === 'Dog') {
      switch (size) {
        case 'small':
          return '5';
        case 'medium':
          return '11';
        case 'large':
          return '26';
        case 'giant':
          return '46';
        default:
          return '';
      }
    } else if (petType === 'Cat') {
      switch (size) {
        case 'small':
          return '1.8';
        case 'medium':
          return '4.6';
        case 'large':
          return '6.9';
        default:
          return '';
      }
    }
    return '';
  };

  // (helpers moved to module scope)

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
      console.log(
        '🗓️ Editing pet date_of_birth:',
        editingPet.date_of_birth,
        typeof editingPet.date_of_birth,
      );

      // Format the date for HTML date input (YYYY-MM-DD)
      let formattedDate = '';
      if (editingPet.date_of_birth) {
        try {
          const date = new Date(editingPet.date_of_birth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        } catch (error) {
          console.error('🗓️ Error parsing date:', error);
        }
      }
      console.log('🗓️ Formatted date for input:', formattedDate);

      // If there is a DOB, compute an age to keep consistency
      const computedAgeLabel = getAgeLabel(
        formattedDate,
        typeof editingPet.age === 'number' ? editingPet.age : null,
      );
      setFormData({
        name: editingPet.name || '',
        type: editingPet.type || '',
        breed: editingPet.breed || '',
        gender: editingPet.gender || '',
        age: computedAgeLabel,
        date_of_birth: formattedDate,
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
        color: editingPet.color || '',
      });

      console.log('🗓️ Setting formData.date_of_birth to:', formattedDate);

      const parsedDate = editingPet.date_of_birth ? new Date(editingPet.date_of_birth) : undefined;
      console.log('🗓️ Parsed birthDate:', parsedDate);
      setBirthDate(parsedDate);
      // Don't set existing photos to photosPreviews - they're handled separately via formData.photos
      console.log('Existing pet photos will be displayed via formData.photos:', editingPet.photos);
      setPhotosPreviews([]); // Clear previews for new files only
      setPhotoFiles([]); // Clear local files when editing existing pet
    } else {
      console.log('Setting up form for new pet');
      // Reset form for new pet
      setFormData({
        name: '',
        type: '',
        color: '',
        breed: '',
        gender: '',
        age: '',
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
      setPhotoFiles([]); // Clear local files for new pet
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

    // Debug: Log the current formData.date_of_birth value
    console.log('🗓️ Current formData.date_of_birth:', formData.date_of_birth);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    if (isSubmitting) {
      return; // Prevent double submission
    }

    setIsSubmitting(true);
    setUploadError(''); // Clear any previous errors

    // Ensure all required fields are present and normalized
    // Prefer manually entered age label if present; otherwise compute from DOB
    const computedAgeLabelForSubmit =
      formData.age && formData.age.trim()
        ? formData.age.trim()
        : getAgeLabel(formData.date_of_birth, '');

    const petData = {
      name: formData.name,
      type: formData.type,
      breed: formData.breed,
      gender: formData.gender,
      age: computedAgeLabelForSubmit,
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
      color: formData.color || '',
      photos: editingPet ? formData.photos || [] : [], // For editing, keep existing photos; for new pets, photos will be uploaded
    };

    console.log('🐾 PetModal - Submitting pet data:', {
      ...petData,
      color: `"${petData.color}"`, // Show color value explicitly
      formDataColor: `"${formData.color}"`, // Show original form color
    });

    try {
      await onSubmit(petData, photoFiles);
      onOpenChange(false);
    } catch (error) {
      console.error('Pet submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save pet';
      setUploadError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    if (field === 'photo') {
      console.log('Updating photo field:', value);
    }

    // Debug logging for color field
    if (field === 'color') {
      console.log('Updating color field:', value, 'Current color:', formData.color);
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

      // Recalculate size based on current weight and new pet type
      let calculatedSize = formData.size;
      if (formData.weight) {
        const newSize = calculateSizeFromWeight(formData.weight, newType);
        if (newSize) {
          calculatedSize = newSize;
        }
      }

      setFormData((prev) => ({
        ...prev,
        type: newType,
        ...(shouldClearColor && { color: '' }),
        ...(shouldClearBreed && { breed: '' }),
        ...(calculatedSize !== formData.size && { size: calculatedSize }),
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
              <Label htmlFor="name">Pet Name</Label>
              <Input
                id="name"
                placeholder="e.g., Buddy"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
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
                                <Image
                                  src={breed.image}
                                  alt={breed.name}
                                  width={24}
                                  height={24}
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
                                  <Image
                                    src={breed.image}
                                    alt={breed.name}
                                    width={24}
                                    height={24}
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
                  value={formData.color || ''}
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
                onValueChange={(value) => {
                  handleInputChange('size', value);

                  // Always set default weight based on minimum for selected size category
                  if (formData.type && value) {
                    const minWeight = getMinWeightForSize(value, formData.type);
                    if (minWeight) {
                      handleInputChange('weight', minWeight);
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">
                    Small
                    {formData.type === 'Dog' && ' (5-10kg)'}
                    {formData.type === 'Cat' && ' (1.8-4.5kg)'}
                  </SelectItem>
                  <SelectItem value="medium">
                    Medium
                    {formData.type === 'Dog' && ' (11-25kg)'}
                    {formData.type === 'Cat' && ' (4.6-6.8kg)'}
                  </SelectItem>
                  <SelectItem value="large">
                    Large
                    {formData.type === 'Dog' && ' (26-45kg)'}
                    {formData.type === 'Cat' && ' (6.9kg+)'}
                  </SelectItem>
                  {formData.type === 'Dog' && <SelectItem value="giant">Giant (46kg+)</SelectItem>}
                </SelectContent>
              </Select>
              {formData.type && (
                <p className="text-xs text-muted-foreground">
                  Size is automatically calculated based on weight. Selecting a size manually will
                  set a default weight.
                </p>
              )}
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

                    // Automatically calculate and set size based on weight and pet type
                    if (formData.type && numericValue) {
                      const calculatedSize = calculateSizeFromWeight(numericValue, formData.type);
                      if (calculatedSize) {
                        handleInputChange('size', calculatedSize);
                      }
                    }
                  }}
                  className="rounded-r-none"
                />
                <div className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                  kg
                </div>
              </div>
              {formData.type && (
                <p className="text-xs text-muted-foreground">
                  Weight automatically determines size category. Size selection sets default weight.
                </p>
              )}
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full justify-start text-left font-normal bg-transparent"
                    >
                      {birthDate ? birthDate.toLocaleDateString() : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthDate}
                      onSelect={(date) => {
                        setBirthDate(date);
                        if (date) {
                          const dateString = date.toISOString().split('T')[0];
                          handleInputChange('date_of_birth', dateString);

                          // Auto-calculate and set age label based on birth date
                          const calculatedLabel = getAgeLabel(dateString);
                          handleInputChange('age', calculatedLabel);

                          // Clear any age validation errors since we're auto-setting
                          setValidationErrors((prev) => ({ ...prev, age: '' }));
                        } else {
                          handleInputChange('date_of_birth', '');
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-xs text-gray-500">Future dates are not allowed.</p>
              {validationErrors.date_of_birth && (
                <p className="text-sm text-red-500">{validationErrors.date_of_birth}</p>
              )}
            </div>

            {/* Age - editable but auto-populated based on DOB */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
              {ageWarning && <p className="text-xs text-amber-600">{ageWarning}</p>}
              {formData.date_of_birth && (
                <p className="text-xs text-muted-foreground">Based on the selected date of birth</p>
              )}
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

            {/* Vaccination Status */}
            <div className="space-y-2">
              <Label htmlFor="is_vaccinated">Vaccination Status</Label>
              <Select
                value={formData.is_vaccinated ? 'yes' : 'no'}
                onValueChange={(value) => handleInputChange('is_vaccinated', value === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccination status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Vaccinated</SelectItem>
                  <SelectItem value="no">Not Vaccinated</SelectItem>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="special_needs">Special Needs</Label>
                <Tooltip>
                  <TooltipTrigger type="button">
                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Specify if the pet requires medical attention, vitamins, special care, or a
                      special diet.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
            />
            {(formData.photos && formData.photos.length > 0) || photosPreviews.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-0">
                  {/* Existing pet photos (from editing) */}
                  {editingPet &&
                    formData.photos &&
                    formData.photos.map((photoUrl, index) => (
                      <div
                        key={`existing-${photoUrl}-${index}`}
                        className="relative group w-[128px] h-[128px] m-0 p-0"
                      >
                        <Image
                          src={photoUrl}
                          alt={`Existing pet photo ${index + 1}`}
                          width={128}
                          height={128}
                          className="w-32 h-32 object-cover rounded-lg border m-0"
                          onError={(e) => {
                            console.error('Failed to load existing image:', photoUrl);
                            e.currentTarget.src = '/empty_pet.png';
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-0 left-0 h-6 w-6 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={() => removePhoto(photoUrl)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  {/* New photo previews (from file selection) */}
                  {photosPreviews.map((photoUrl, index) => (
                    <div
                      key={`preview-${photoUrl}-${index}`}
                      className="relative group w-[128px] h-[128px] m-0 p-0"
                    >
                      <Image
                        src={photoUrl}
                        alt={`New pet preview ${index + 1}`}
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded-lg border-2 border-blue-300 m-0"
                        onError={(e) => {
                          console.error('Failed to load preview image:', photoUrl);
                          e.currentTarget.src = '/empty_pet.png';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 left-0 h-6 w-6 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={() => removePhoto(photoUrl)}
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
                  >
                    Choose Files
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingPet ? 'Update Pet' : 'Add Pet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
