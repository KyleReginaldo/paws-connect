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
    end_date: '',
    facebook_link: '',
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        end_date: editingCampaign.end_date || '',
        facebook_link: editingCampaign.facebook_link || '',
      });
      setImagePreviews((editingCampaign?.images as string[]) || []);
    } else {
      setFormData({
        title: '',
        description: '',
        target_amount: 1000,
        created_by: currentUserId || '',
        images: [],
        status: 'PENDING',
        end_date: '',
        facebook_link: '',
      });
      setImagePreviews([]);
    }
    // Clear error when modal opens/closes or campaign changes
    setError(null);
  }, [editingCampaign, open, currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION START ===');
    console.log('📝 Current formData:', formData);
    console.log('🖼️ Current image previews:', imagePreviews.length);
    console.log('⬆️ Is uploading:', isUploading);

    setIsSubmitting(true);
    setError(null);

    if (isUploading) {
      console.log('❌ Upload in progress, blocking submission');
      setError('Please wait for image uploads to finish before submitting.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Validate required fields before submission
      console.log('🔍 Validating form fields...');
      if (!formData.title || formData.title.length < 2) {
        console.log('❌ Title validation failed');
        setError('Title must be at least 2 characters');
        return;
      }
      if (!formData.description || formData.description.length < 10) {
        console.log('❌ Description validation failed');
        setError('Description must be at least 10 characters');
        return;
      }
      if (!formData.target_amount || formData.target_amount < 100) {
        console.log('❌ Target amount validation failed');
        setError('Target amount must be at least ₱100');
        return;
      }
      if (!formData.created_by) {
        console.log('❌ User ID validation failed');
        setError('User ID is required');
        return;
      }

      console.log('✅ Form validation passed');

      let result;
      if (editingCampaign) {
        console.log('📝 Updating existing campaign:', editingCampaign.id);
        // For editing, we don't need created_by
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { created_by, ...updateData } = formData;
        console.log('📤 Update data:', updateData);
        result = await onSubmit(updateData);
      } else {
        // Ensure proper data types for create
        const submitData = {
          ...formData,
          target_amount: Number(formData.target_amount),
          images: formData.images || [],
        };
        console.log('📤 Submitting new campaign data:', submitData);
        console.log('🖼️ Images being submitted:', submitData.images);
        result = await onSubmit(submitData);
      }

      console.log('📨 Submission result:', result);

      if (result.success) {
        console.log('✅ Campaign submission successful');
        onOpenChange(false);
      } else {
        console.log('❌ Campaign submission failed:', result.error);
        setError(result.error || 'An error occurred while saving the campaign');
      }
    } catch (error) {
      console.error('❌ Error submitting campaign data:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      console.log('=== FORM SUBMISSION END ===');
    }
  };

  const handleInputChange = (field: keyof CreateFundraisingDto, value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (files: FileList) => {
    console.log('=== IMAGE UPLOAD START ===');
    console.log('📁 Files to upload:', files.length);

    if (files.length === 0) {
      console.log('❌ No files selected');
      return;
    }

    setError(null);
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    const localPreviews: string[] = [];

    console.log('🔄 Starting upload process...');
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📤 Processing file ${i + 1}/${files.length}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // create local preview
      const localUrl = URL.createObjectURL(file);
      localPreviews.push(localUrl);
      console.log('🖼️ Local preview created:', localUrl);

      try {
        console.log(`⬆️ Uploading file: ${file.name}`);
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/v1/fundraising/upload', {
          method: 'POST',
          body: fd,
        });

        const json = await res.json();
        console.log(`📨 Upload response for ${file.name}:`, json);

        if (!res.ok) {
          const details = json?.details || json?.error || 'Unknown';
          console.error(
            '❌ Upload failed for file',
            file.name,
            'Status:',
            res.status,
            'Details:',
            details,
          );
          setError(`Failed to upload ${file.name}: ${details}`);
          continue;
        }

        if (json?.url) {
          uploadedUrls.push(json.url);
          console.log(`✅ Successfully uploaded ${file.name}, URL: ${json.url}`);
        } else {
          console.error('❌ Upload did not return a url for file', file.name, json);
          setError(`Upload did not return a url for ${file.name}`);
        }
      } catch (err) {
        console.error('❌ Error uploading file', file.name, err);
        setError(`Error uploading ${file.name}. See console for details.`);
      }
    }

    console.log('🎯 All uploads completed. URLs:', uploadedUrls);
    console.log('📊 Upload summary:', {
      totalFiles: files.length,
      successfulUploads: uploadedUrls.length,
      failedUploads: files.length - uploadedUrls.length,
    });

    // Add uploaded URLs to form and show local previews
    setFormData((prev) => {
      const newImages = [...(prev.images || []), ...uploadedUrls];
      console.log('💾 Updated formData.images:', newImages);
      return {
        ...prev,
        images: newImages,
      };
    });

    setImagePreviews((prev) => {
      const newPreviews = [...prev, ...localPreviews];
      console.log('🖼️ Updated image previews:', newPreviews.length, 'total previews');
      return newPreviews;
    });

    setIsUploading(false);
    console.log('=== IMAGE UPLOAD END ===');
  };

  const handleImageFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      console.log('📁 Files selected for upload:');
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const filesToUpload: File[] = [];
      const rejectedFiles: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

        console.log(`  📄 ${file.name}: ${fileSizeMB}MB (${file.type})`);

        if (file.size > MAX_FILE_SIZE) {
          rejectedFiles.push(`${file.name} (${fileSizeMB}MB - too large)`);
        } else {
          filesToUpload.push(file);
        }
      }

      if (rejectedFiles.length > 0) {
        setError(`Some files are too large (max 10MB): ${rejectedFiles.join(', ')}`);
      }

      if (filesToUpload.length > 0) {
        const fileList = new DataTransfer();
        filesToUpload.forEach((file) => fileList.items.add(file));
        handleImageUpload(fileList.files);
      }
    }
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
              <div className="flex items-center justify-between">
                <Label>Images (optional)</Label>
                {isUploading && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageFiles(e.target.files)}
              />
              <p className="text-xs text-muted-foreground">
                Upload images for your campaign. Max 10MB per file. Supported formats: JPG, PNG,
                GIF, WebP
              </p>
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

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => handleInputChange('end_date', e.target.value || '')}
                placeholder="Select end date"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no end date. Campaign will continue until target is reached.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_link">Facebook Link (optional)</Label>
              <Input
                id="facebook_link"
                type="url"
                value={formData.facebook_link || ''}
                onChange={(e) => handleInputChange('facebook_link', e.target.value || '')}
                placeholder="https://facebook.com/your-campaign"
              />
              <p className="text-xs text-muted-foreground">
                Link to your Facebook page or post about this campaign
              </p>
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
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading
                    ? editingCampaign
                      ? 'Uploading...'
                      : 'Uploading...'
                    : editingCampaign
                      ? 'Updating...'
                      : 'Creating...'}
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
