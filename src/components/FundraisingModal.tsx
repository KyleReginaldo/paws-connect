'use client';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Textarea } from '@/components/ui/textarea';
import { CreateFundraisingDto, UpdateFundraisingDto } from '@/config/schema/fundraisingSchema';
import { Fundraising } from '@/config/types/fundraising';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FundraisingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (campaignData: CreateFundraisingDto | UpdateFundraisingDto) => Promise<{
    success: boolean;
    error?: string;
  }>;
  editingCampaign?: Fundraising | null;
  currentUserId?: string | null;
}

export function FundraisingModal({
  open,
  onOpenChange,
  onSubmit,
  editingCampaign,
  currentUserId,
}: FundraisingModalProps) {
  const [formData, setFormData] = useState<CreateFundraisingDto>({
    title: '',
    description: '',
    target_amount: 1000,
    created_by: currentUserId || '',
    images: [],
    status: 'PENDING',
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingCampaign) {
      setFormData({
        title: editingCampaign.title || '',
        description: editingCampaign.description || '',
        target_amount: editingCampaign.target_amount || 1000,
        created_by: editingCampaign.created_by || currentUserId || '',
        images: (editingCampaign?.images as string[]) || [],
        status:
          (editingCampaign.status as
            | 'PENDING'
            | 'ONGOING'
            | 'COMPLETE'
            | 'REJECTED'
            | 'CANCELLED') || 'PENDING',
      });
      setImagePreviews((editingCampaign?.images as string[]) || []);
    } else {
      setFormData({
        title: '',
        description: '',
        target_amount: 1000,
        created_by: currentUserId || '',
        status: 'PENDING',
      });
    }
    // Clear error when modal opens/closes or campaign changes
    setError(null);
  }, [editingCampaign, open, currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let result;
      if (editingCampaign) {
        // For editing, we don't need created_by
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { created_by, ...updateData } = formData;
        result = await onSubmit(updateData);
      } else {
        result = await onSubmit(formData);
      }

      if (result.success) {
        onOpenChange(false);
      } else {
        setError(result.error || 'An error occurred while saving the campaign');
      }
    } catch (error) {
      console.error('Error submitting campaign data:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateFundraisingDto, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr: string[] = [];
    const readers: Promise<void>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const p = new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          arr.push(result);
          resolve();
        };
      });
      readers.push(p);
      reader.readAsDataURL(file);
    }

    Promise.all(readers).then(() => {
      setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ...arr] }));
      setImagePreviews((prev) => [...prev, ...arr]);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCampaign ? 'Edit Campaign' : 'Create New Fundraising Campaign'}
          </DialogTitle>
          <DialogDescription>
            {editingCampaign
              ? 'Update the campaign information below.'
              : 'Fill in the information to create a new fundraising campaign.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter campaign title"
                required
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your fundraising campaign..."
                required
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label>Images (optional)</Label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageFiles(e.target.files)}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="w-20 h-20 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`preview-${idx}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_amount">Target Amount (₱) *</Label>
              <Input
                id="target_amount"
                type="number"
                value={formData.target_amount}
                onChange={(e) => handleInputChange('target_amount', parseInt(e.target.value) || 0)}
                placeholder="Enter target amount"
                required
                min={100}
                max={10000000}
              />
              <p className="text-xs text-muted-foreground">Minimum: ₱100, Maximum: ₱10,000,000</p>
            </div>

            {editingCampaign && (
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingCampaign ? 'Updating...' : 'Creating...'}
                </>
              ) : editingCampaign ? (
                'Update Campaign'
              ) : (
                'Create Campaign'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
