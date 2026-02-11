'use client';
import { useAuth } from '@/app/context/AuthContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/config/models/users';
import { CreateUserDto, UpdateUserDto } from '@/config/schema/userChema';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userData: CreateUserDto | UpdateUserDto) => Promise<void>;
  editingUser?: User | null;
}

export function UserModal({ open, onOpenChange, onSubmit, editingUser }: UserModalProps) {
  const [formData, setFormData] = useState<CreateUserDto>({
    username: '',
    email: '',
    phone_number: '',
    role: 3, // Default to regular user
    password: '',
    status: 'PENDING',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const { userId, userRole } = useAuth();

  // Phone number validation regex
  const PHONE_REGEX = /^(\+?63|0)?9\d{9}$/; // Philippine format
  const INTERNATIONAL_PHONE_REGEX = /^\+\d{1,3}\d{6,14}$/; // International format

  // Validate phone number
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return false;
    const cleaned = phone.replace(/[^\d+]/g, '');
    return PHONE_REGEX.test(cleaned) || INTERNATIONAL_PHONE_REGEX.test(cleaned);
  };

  // Permission helper - Only admins can manage users
  const canManageUser = () => {
    // Only admins (role 1) can manage users
    return userRole === 1;
  };

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username || '',
        email: editingUser.email || '',
        phone_number: editingUser.phone_number || '',
        role: editingUser.role || 3,
        status: editingUser.status || 'ACTIVE',
        password: '', // Don't pre-fill password for security
      });
    } else {
      setFormData({
        username: '',
        email: '',
        phone_number: '',
        role: 3,
        password: '',
        status: 'PENDING',
      });
    }
    setFormError(null);
    setPhoneError(null);
  }, [editingUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setPhoneError(null);

    // Validate phone number before submission
    if (formData.phone_number && !validatePhoneNumber(formData.phone_number)) {
      setPhoneError(
        'Invalid phone number format. Use Philippine format (09XXXXXXXXX or +639XXXXXXXXX) or international format (+[country code][number])',
      );
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingUser) {
        // For updates, only send fields that have values and exclude password if empty
        const updatePayload: Partial<UpdateUserDto> = {};

        if (formData.username && formData.username.trim()) {
          updatePayload.username = formData.username.trim();
        }
        if (formData.email && formData.email.trim()) {
          updatePayload.email = formData.email.trim();
        }
        if (formData.phone_number && formData.phone_number.trim()) {
          updatePayload.phone_number = formData.phone_number.trim();
        }
        // Only include role if it's different from the original
        if (
          formData.role !== undefined &&
          formData.role !== null &&
          formData.role !== editingUser.role
        ) {
          updatePayload.role = formData.role;
        }
        if (formData.status && formData.status.trim()) {
          updatePayload.status = formData.status as
            | 'PENDING'
            | 'SEMI_VERIFIED'
            | 'FULLY_VERIFIED'
            | 'INDEFINITE';
        }
        // Only include password if it's provided and has minimum length
        if (formData.password && formData.password.length >= 6) {
          updatePayload.password = formData.password;
        }

        await onSubmit(updatePayload as UpdateUserDto);
      } else {
        // For new users, include created_by and generate password if needed
        const createPayload = { ...formData, created_by: userId } as CreateUserDto;

        if (!createPayload.password || createPayload.password.length < 8) {
          const rand = Math.random().toString(36).slice(2, 8);
          createPayload.password = `A@${rand}1`;
        }

        await onSubmit(createPayload);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting user data:', error);
      const message = error instanceof Error ? error.message : 'Failed to save user.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserDto, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear phone error when user starts typing
    if (field === 'phone_number') {
      setPhoneError(null);
    }
  };

  const handlePhoneBlur = () => {
    // Validate phone on blur
    if (formData.phone_number && !validatePhoneNumber(formData.phone_number)) {
      setPhoneError('Invalid phone number format');
    } else {
      setPhoneError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {editingUser
              ? 'Update the user information below.'
              : 'Fill in the information to create a new user account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Username<span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email<span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number<span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                onBlur={handlePhoneBlur}
                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                required
                className={phoneError ? 'border-red-500' : ''}
              />
              {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Philippine: 09XXXXXXXXX or +639XXXXXXXXX
                <br />
                International: +[country code][number]
              </p>
            </div>

            {editingUser ? (
              // Show role field for editing if user has permission to manage this user
              canManageUser() ? (
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.role.toString()}
                    onValueChange={(value) => handleInputChange('role', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                // Show read-only role display for admins that staff cannot edit
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    value={editingUser.role === 1 ? 'Admin' : 'User'}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              )
            ) : (
              // For new users, show role selection
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role.toString()}
                  onValueChange={(value) => handleInputChange('role', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULLY_VERIFIED">Fully Verified</SelectItem>
                  <SelectItem value="SEMI_VERIFIED">Semi Verified</SelectItem>
                  <SelectItem value="INDEFINITE">Indefinite</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
              {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
