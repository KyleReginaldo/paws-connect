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
import { useEffect, useState } from 'react';

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
    status: 'ACTIVE',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userId, userRole } = useAuth();

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
        status: 'ACTIVE',
      });
    }
  }, [editingUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserDto, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="Enter phone number"
                required
              />
            </div>

            {editingUser ? (
              // Show role field for editing if user has permission to manage this user
              canManageUser() ? (
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role.toString()}
                    onValueChange={(value) => handleInputChange('role', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Only show Admin option to actual admins */}
                      {userRole === 1 && <SelectItem value="1">Admin</SelectItem>}
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
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role.toString()}
                  onValueChange={(value) => handleInputChange('role', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Only show Admin option to actual admins */}
                    {userRole === 1 && <SelectItem value="1">Admin</SelectItem>}
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
