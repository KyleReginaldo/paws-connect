'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import type { Pet } from '../config/types/pet';

interface PetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (petData: Omit<Pet, 'id' | 'dateAdded'>) => void;
  editingPet?: Pet | null;
}

export function PetModal({ open, onOpenChange, onSubmit, editingPet }: PetModalProps) {
  const [birthDate, setBirthDate] = useState<Date>();
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    gender: '',
    weight: '',
    color: '',
    description: '',
    microchipId: '',
    vaccinated: '',
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setUploadError('');
  };

  useEffect(() => {
    if (editingPet) {
      setFormData({
        name: editingPet.name,
        species: editingPet.species,
        breed: editingPet.breed,
        gender: editingPet.gender,
        weight: editingPet.weight,
        color: editingPet.color,
        description: editingPet.description,
        microchipId: editingPet.microchipId,
        vaccinated: editingPet.vaccinated,
      });
      setBirthDate(editingPet.birthDate);
      setPhotoPreview(editingPet.photo || '');
    } else {
      // Reset form for new pet
      setFormData({
        name: '',
        species: '',
        breed: '',
        gender: '',
        weight: '',
        color: '',
        description: '',
        microchipId: '',
        vaccinated: '',
      });
      setBirthDate(undefined);
      setPhotoPreview('');
    }
    setUploadError('');
  }, [editingPet, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, birthDate, photo: photoPreview });
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
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
            {/* Pet Name */}
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

            {/* Species */}
            <div className="space-y-2">
              <Label htmlFor="species">Species *</Label>
              <Select
                value={formData.species}
                onValueChange={(value) => handleInputChange('species', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="hamster">Hamster</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                  <SelectItem value="reptile">Reptile</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color/Markings</Label>
              <Input
                id="color"
                placeholder="e.g., Brown and white"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
              />
            </div>

            {/* Microchip ID */}
            <div className="space-y-2">
              <Label htmlFor="microchip">Microchip ID</Label>
              <Input
                id="microchip"
                placeholder="e.g., 123456789012345"
                value={formData.microchipId}
                onChange={(e) => handleInputChange('microchipId', e.target.value)}
              />
            </div>

            {/* Vaccination Status */}
            <div className="space-y-2">
              <Label htmlFor="vaccinated">Vaccination Status</Label>
              <Select
                value={formData.vaccinated}
                onValueChange={(value) => handleInputChange('vaccinated', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="up-to-date">Up to date</SelectItem>
                  <SelectItem value="partial">Partially vaccinated</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
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
                  <img
                    src={photoPreview || '/placeholder.svg'}
                    alt="Pet preview"
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
