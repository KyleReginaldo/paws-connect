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
import { format } from 'date-fns';
import { CalendarIcon, Upload } from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { Pet } from '../config/types/pet';

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
    photo: string;
  }>({
    name: '',
    type: '',
    color: '',
    breed: '',
    gender: '',
    age: 0,
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
    photo: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, or WebP)';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    return null;
  };

  const handleFileUpload = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
      // Also update the form data
      handleInputChange('photo', result);
    };
    reader.readAsDataURL(file);
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

  const handleDragOver = (_e: React.DragEvent) => {
    _e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (_e: React.DragEvent) => {
    _e.preventDefault();
    setIsDragOver(false);
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setUploadError('');
    // Also clear the form data
    handleInputChange('photo', '');
  };

  useEffect(() => {
    console.log(`user in modal: ${userId}`);
    if (editingPet) {
      setFormData({
        name: editingPet.name || '',
        type: editingPet.type || '',
        breed: editingPet.breed || '',
        gender: editingPet.gender || '',
        age: editingPet.age || 1,
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
        photo: editingPet.photo || '',
      });
      setBirthDate(editingPet.date_of_birth ? new Date(editingPet.date_of_birth) : undefined);
      setPhotoPreview(editingPet.photo || '');
    } else {
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
        photo: '',
      });
      setBirthDate(undefined);
      setPhotoPreview('');
    }
    setUploadError('');
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
  }, [editingPet, open, userId]);

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
      weight:
        (typeof formData.weight === 'string'
          ? formData.weight.replace(/[^\d.]/g, '')
          : String(formData.weight)) || '1',
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
      photo: photoPreview || formData.photo || '',
    };
    onSubmit(petData);
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                placeholder="e.g., Golden Retriever"
                value={formData.breed}
                onChange={(e) => handleInputChange('breed', e.target.value)}
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={1}
                value={formData.age}
                onChange={(e) => handleInputChange('age', Number(e.target.value))}
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

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="e.g., Brown/White"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
              />
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
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="rounded-r-none"
                />
                <div className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                  lbs
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
              <Input
                id="health_status"
                placeholder="e.g., Healthy, Allergies, etc."
                value={formData.health_status}
                onChange={(e) => handleInputChange('health_status', e.target.value)}
              />
            </div>

            {/* Good With */}
            <div className="space-y-2">
              <Label>Good With</Label>
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
              <Label htmlFor="is_trained">Trained</Label>
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
            <Label>Pet Photo</Label>
            {photoPreview ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <Image
                    src={photoPreview || '/placeholder.svg'}
                    alt="Pet preview"
                    width={128}
                    height={128}
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removePhoto}
                  >
                    ×
                  </Button>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={removePhoto}>
                  Change Photo
                </Button>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop a photo here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Supports JPEG, PNG, WebP up to 5MB
                </p>
                <div className="relative">
                  <Button type="button" variant="outline" size="sm">
                    Choose File
                  </Button>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            )}
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingPet ? 'Update Pet' : 'Add Pet'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
