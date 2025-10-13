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
import { AlertCircle, Loader2, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FundraisingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    campaignData: CreateFundraisingDto | UpdateFundraisingDto | FormData,
    campaignId?: number,
  ) => Promise<{
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
    qr_code: '',
    gcash_number: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string>('');
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
        end_date: editingCampaign.end_date || '',
        facebook_link: editingCampaign.facebook_link || '',
        qr_code: editingCampaign?.qr_code || '',
        gcash_number: editingCampaign?.gcash_number || '',
      });
      setImagePreviews((editingCampaign?.images as string[]) || []);
      setImageFiles([]); // Clear local files when editing
      setQrCodeFile(null);
      setQrCodePreview(editingCampaign?.qr_code || '');
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
        qr_code: '',
        gcash_number: '',
      });
      setImagePreviews([]);
      setImageFiles([]); // Clear local files for new campaign
      setQrCodeFile(null);
      setQrCodePreview('');
    }
    // Clear error when modal opens/closes or campaign changes
    setError(null);
  }, [editingCampaign, open, currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION START ===');
    console.log('📝 Current formData:', formData);
    console.log('🖼️ Current image files:', imageFiles.length);
    console.log('📱 QR code file:', qrCodeFile ? 'Present' : 'None');

    setIsSubmitting(true);
    setError(null);

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

      // Validate GCash number format if provided
      if (formData.gcash_number && !/^(09|\+639)\d{9}$/.test(formData.gcash_number)) {
        console.log('❌ GCash number validation failed');
        setError('Invalid GCash number format. Use: 09XXXXXXXXX or +639XXXXXXXXX');
        return;
      }

      console.log('✅ Form validation passed');

      // Create FormData for multipart upload
      const formDataToSubmit = new FormData();

      // Add text fields
      formDataToSubmit.append('title', formData.title);
      formDataToSubmit.append('description', formData.description);
      formDataToSubmit.append('target_amount', formData.target_amount.toString());
      formDataToSubmit.append('created_by', formData.created_by);

      if (formData.gcash_number) {
        formDataToSubmit.append('gcash_number', formData.gcash_number);
      }

      // Add image files
      imageFiles.forEach((file) => {
        formDataToSubmit.append(`images`, file);
      });

      // Add QR code file if present
      if (qrCodeFile) {
        formDataToSubmit.append('qr_code', qrCodeFile);
      }

      console.log('📤 FormData prepared with files');

      let result;
      if (editingCampaign) {
        console.log('� Updating existing campaign:', editingCampaign.id);
        result = await onSubmit(formDataToSubmit, editingCampaign.id);
      } else {
        console.log('� Submitting new campaign');
        result = await onSubmit(formDataToSubmit);
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

  const handleImageUpload = (files: FileList) => {
    if (files.length === 0) {
      return;
    }

    setError(null);
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Maximum size is 5MB.`);
        continue;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" is not supported. Please use JPEG, PNG, or WebP images.`);
        continue;
      }

      // Store file and create local preview
      newFiles.push(file);
      const localUrl = URL.createObjectURL(file);
      newPreviews.push(localUrl);
    }

    // Update state with new files and previews
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
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

  const handleQrCodeUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      console.log('❌ No QR code file selected');
      return;
    }

    const file = files[0]; // Only take the first file for QR code
    console.log('=== QR CODE UPLOAD START ===');
    console.log('📱 QR Code file:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`QR code file too large: ${fileSizeMB}MB. Maximum size is 10MB.`);
      return;
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('QR code file is too large. Maximum size is 5MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid QR code file type. Only images (JPG, PNG, GIF, WebP) are allowed.');
      return;
    }

    setError(null);

    // Store file and create local preview
    setQrCodeFile(file);
    const localUrl = URL.createObjectURL(file);
    setQrCodePreview(localUrl);
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

            {/* Payment Information Section */}
            <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">
                    Payment Information
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Optional - Set up donation methods for supporters
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* GCash Number Section */}
                <div className="space-y-3 p-4 bg-white/80 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    <Label
                      htmlFor="gcash_number"
                      className="font-medium text-gray-900 dark:text-gray-100"
                    >
                      GCash Number
                    </Label>
                  </div>
                  <Input
                    id="gcash_number"
                    type="tel"
                    value={formData.gcash_number || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange('gcash_number', value || '');

                      // Real-time validation
                      if (value && !/^(09|\+639)\d{9}$/.test(value)) {
                        // Show validation hint
                        e.target.style.borderColor = '#f59e0b';
                      } else {
                        e.target.style.borderColor = '';
                      }
                    }}
                    placeholder="09123456789 or +639123456789"
                    className="font-mono text-center bg-white/90 dark:bg-gray-800/90"
                  />
                  <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                    <span>Donors can transfer directly to this number</span>
                  </div>
                  {formData.gcash_number && !/^(09|\+639)\d{9}$/.test(formData.gcash_number) && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                      <span className="text-amber-500">⚠️</span>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Use format: 09XXXXXXXXX or +639XXXXXXXXX
                      </p>
                    </div>
                  )}
                </div>

                {/* QR Code Section */}
                <div className="space-y-3 p-4 bg-white/80 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <Label
                        htmlFor="qr_code_upload"
                        className="font-medium text-gray-900 dark:text-gray-100"
                      >
                        GCash QR Code
                      </Label>
                    </div>
                  </div>

                  {!formData.qr_code && !qrCodePreview ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          id="qr_code_upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQrCodeUpload(e.target.files)}
                          className="hidden"
                        />
                        <label
                          htmlFor="qr_code_upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                        >
                          <QrCode className="w-8 h-8 mb-2 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Upload QR Code
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            PNG, JPG up to 10MB
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                        <span>Upload your GCash QR code for easy scanning</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-600 flex items-center justify-center overflow-hidden shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={qrCodePreview || formData.qr_code || ''}
                              alt="QR Code"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.setAttribute(
                                  'style',
                                  'display: flex',
                                );
                              }}
                            />
                            <div
                              className="w-full h-full flex items-center justify-center text-xs text-gray-400"
                              style={{ display: 'none' }}
                            >
                              QR
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                QR Code Ready
                              </p>
                            </div>
                            <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                              Donors can scan this code for instant payments
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                handleInputChange('qr_code', '');
                                setQrCodeFile(null);
                                setQrCodePreview('');
                              }}
                              className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                            >
                              Remove QR code
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              {(formData.gcash_number || formData.qr_code) && (
                <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <strong className="text-emerald-800 dark:text-emerald-200 text-sm">
                      Payment Options Available:
                    </strong>
                  </div>
                  <ul className="space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                    {formData.gcash_number && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        <span>
                          Direct GCash transfer to:{' '}
                          <code className="font-mono bg-emerald-100 dark:bg-emerald-900/50 px-1 rounded text-xs">
                            {formData.gcash_number}
                          </code>
                        </span>
                      </li>
                    )}
                    {formData.qr_code && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        <span>QR code scanning for instant payment</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
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
