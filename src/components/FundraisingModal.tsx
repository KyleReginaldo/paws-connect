'use client';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CreateFundraisingDto, UpdateFundraisingDto } from '@/config/schema/fundraisingSchema';
import { Fundraising } from '@/config/types/fundraising';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  HelpCircle,
  Loader2,
  Plus,
  QrCode,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

// Extended interface for form data with file properties
interface FundraisingFormData {
  id?: number;
  title: string;
  description: string;
  purpose: string;
  target_amount: number;
  raised_amount?: number | null;
  images: string[];
  status: string;
  created_by: string;
  created_at?: string;
  end_date: string;
  facebook_link: string;
  qr_code: string;
  bank_accounts: Array<{
    label: string;
    account_number: string;
    qr_code?: string | null;
    qr_code_file?: File;
  }>;
  e_wallets: Array<{
    label: string;
    account_number: string;
    qr_code?: string | null;
    qr_code_file?: File;
  }>;
  links: string[];
}

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
  const [formData, setFormData] = useState<FundraisingFormData>({
    title: '',
    description: '',
    purpose: '',
    target_amount: 1000,
    created_by: currentUserId || '',
    images: [],
    status: 'PENDING',
    end_date: '',
    facebook_link: '',
    qr_code: '',
    bank_accounts: [],
    e_wallets: [],
    links: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // End date calendar picker state
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [endDateObj, setEndDateObj] = useState<Date | undefined>(
    formData.end_date ? new Date(formData.end_date) : undefined,
  );
  const [endDateMonth, setEndDateMonth] = useState<Date | undefined>(endDateObj);
  const [endDateValue, setEndDateValue] = useState<string>(formatDisplayDate(endDateObj));

  function formatDisplayDate(date?: Date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  function isValidDate(date?: Date) {
    if (!date) return false;
    return !isNaN(date.getTime());
  }

  useEffect(() => {
    if (editingCampaign) {
      setFormData({
        title: editingCampaign.title || '',
        description: editingCampaign.description || '',
        purpose: editingCampaign.purpose || '',
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
        bank_accounts: editingCampaign?.bank_accounts || [],
        e_wallets: editingCampaign?.e_wallets || [],
        links: editingCampaign?.links || [],
      });
      setImagePreviews((editingCampaign?.images as string[]) || []);
      setImageFiles([]); // Clear local files when editing
      const parsedEnd = editingCampaign.end_date ? new Date(editingCampaign.end_date) : undefined;
      setEndDateObj(parsedEnd);
      setEndDateMonth(parsedEnd);
      setEndDateValue(formatDisplayDate(parsedEnd));
    } else {
      setFormData({
        title: '',
        description: '',
        purpose: '',
        target_amount: 1000,
        created_by: currentUserId || '',
        images: [],
        status: 'PENDING',
        end_date: '',
        facebook_link: '',
        qr_code: '',
        bank_accounts: [],
        e_wallets: [],
        links: [],
      });
      setImagePreviews([]);
      setImageFiles([]); // Clear local files for new campaign
      setEndDateObj(undefined);
      setEndDateMonth(undefined);
      setEndDateValue('');
    }
    // Clear error when modal opens/closes or campaign changes
    setError(null);
  }, [editingCampaign, open, currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION START ===');
    console.log('📝 Current formData:', formData);
    console.log('🖼️ Current image files:', imageFiles.length);

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

      // Validate end date is not in the past
      if (formData.end_date) {
        const endDate = new Date(formData.end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day

        if (endDate < today) {
          console.log('❌ End date validation failed - date is in the past');
          setError('End date cannot be in the past');
          return;
        }
      }

      console.log('✅ Form validation passed');

      // Create FormData for multipart upload
      const formDataToSubmit = new FormData();

      // Add text fields
      formDataToSubmit.append('title', formData.title);
      formDataToSubmit.append('description', formData.description);
      if (formData.purpose) {
        formDataToSubmit.append('purpose', formData.purpose);
      }
      formDataToSubmit.append('target_amount', formData.target_amount.toString());
      formDataToSubmit.append('created_by', formData.created_by);

      // Add new fields as JSON strings (without qr_code_file properties)
      if (formData.bank_accounts && formData.bank_accounts.length > 0) {
        // Create clean bank accounts without qr_code_file for JSON
        const cleanBankAccounts = formData.bank_accounts.map((account) => ({
          label: account.label,
          account_number: account.account_number,
          qr_code: account.qr_code,
        }));
        formDataToSubmit.append('bank_accounts', JSON.stringify(cleanBankAccounts));

        // Add bank account QR code files separately
        formData.bank_accounts.forEach((account, index) => {
          if (account.qr_code_file) {
            formDataToSubmit.append(`bank_qr_${index}`, account.qr_code_file);
          }
        });
      }

      if (formData.e_wallets && formData.e_wallets.length > 0) {
        // Create clean e-wallets without qr_code_file for JSON
        const cleanEWallets = formData.e_wallets.map((wallet) => ({
          label: wallet.label,
          account_number: wallet.account_number,
          qr_code: wallet.qr_code,
        }));
        formDataToSubmit.append('e_wallets', JSON.stringify(cleanEWallets));

        // Add e-wallet QR code files separately
        formData.e_wallets.forEach((wallet, index) => {
          if (wallet.qr_code_file) {
            formDataToSubmit.append(`wallet_qr_${index}`, wallet.qr_code_file);
          }
        });
      }

      if (formData.links && formData.links.length > 0) {
        formDataToSubmit.append('links', JSON.stringify(formData.links));
      }

      // Add optional fields
      if (formData.end_date) {
        formDataToSubmit.append('end_date', formData.end_date);
      }

      if (formData.facebook_link) {
        formDataToSubmit.append('facebook_link', formData.facebook_link);
      }

      // Add image files
      imageFiles.forEach((file) => {
        formDataToSubmit.append(`images`, file);
      });

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

  // Helper functions for managing dynamic arrays
  const addBankAccount = () => {
    const currentAccounts = formData.bank_accounts || [];
    if (currentAccounts.length < 10) {
      setFormData((prev) => ({
        ...prev,
        bank_accounts: [...currentAccounts, { label: '', account_number: '', qr_code: null }],
      }));
    }
  };

  const updateBankAccount = (
    index: number,
    field: 'label' | 'account_number' | 'qr_code',
    value: string,
  ) => {
    const currentAccounts = formData.bank_accounts || [];
    const updatedAccounts = currentAccounts.map((account, i) =>
      i === index ? { ...account, [field]: value } : account,
    );
    setFormData((prev) => ({
      ...prev,
      bank_accounts: updatedAccounts,
    }));
  };

  const handleBankAccountQrCodeUpload = (index: number, files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (file.size > maxSize) {
        setError(`QR code file is too large. Maximum size is 10MB.`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setError(`QR code file format not supported. Please use JPEG, PNG, or WebP.`);
        return;
      }

      // Store file for bank account
      const currentAccounts = formData.bank_accounts || [];
      const updatedAccounts = currentAccounts.map((account, i) =>
        i === index ? { ...account, qr_code_file: file } : account,
      );
      setFormData((prev) => ({
        ...prev,
        bank_accounts: updatedAccounts,
      }));
    }
  };
  const removeBankAccount = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bank_accounts: prev.bank_accounts?.filter((_, i) => i !== index) || [],
    }));
  };

  // Helper functions for managing e-wallets
  const addEWallet = () => {
    if ((formData.e_wallets?.length || 0) < 10) {
      setFormData((prev) => ({
        ...prev,
        e_wallets: [...(prev.e_wallets || []), { label: '', account_number: '', qr_code: null }],
      }));
    }
  };

  const updateEWallet = (
    index: number,
    field: 'label' | 'account_number' | 'qr_code',
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      e_wallets:
        prev.e_wallets?.map((wallet, i) =>
          i === index ? { ...wallet, [field]: value || null } : wallet,
        ) || [],
    }));
  };

  const handleEWalletQrCodeUpload = (index: number, files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (file.size > maxSize) {
        setError(`QR code file is too large. Maximum size is 10MB.`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setError(`QR code file format not supported. Please use JPEG, PNG, or WebP.`);
        return;
      }

      // Store file for e-wallet
      const updatedWallets = (formData.e_wallets || []).map((wallet, i) =>
        i === index ? { ...wallet, qr_code_file: file } : wallet,
      );
      setFormData((prev) => ({
        ...prev,
        e_wallets: updatedWallets,
      }));
    }
  };

  const removeEWallet = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      e_wallets: prev.e_wallets?.filter((_, i) => i !== index) || [],
    }));
  };

  // Helper functions for managing links
  const addLink = () => {
    if ((formData.links?.length || 0) < 10) {
      setFormData((prev) => ({
        ...prev,
        links: [...(prev.links || []), ''],
      }));
    }
  };

  const updateLink = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links?.map((link, i) => (i === index ? value : link)) || [],
    }));
  };

  const removeLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links?.filter((_, i) => i !== index) || [],
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
      if (fileInputRef.current) fileInputRef.current.value = '';
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
              <Label htmlFor="title">
                Campaign Title <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="purpose">Purpose</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Explain the specific purpose of this fundraising campaign (e.g., medical
                        care, feeding program, shelter maintenance)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="purpose"
                value={formData.purpose || ''}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                placeholder="e.g., Medical care for rescued animals, Emergency shelter repairs..."
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {(formData.purpose || '').length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Images (optional)</Label>
              </div>
              <Input
                id="campaign-images"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageFiles(e.target.files)}
                multiple
              />
              <p className="text-xs text-muted-foreground">
                Upload images for your campaign. Max 10MB per file. Supported formats: JPG, PNG,
                GIF, WebP
              </p>
              {imageFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected:{' '}
                  {imageFiles
                    .slice(0, 3)
                    .map((f) => f.name)
                    .join(', ')}
                  {imageFiles.length > 3 && ` +${imageFiles.length - 3} more`}
                </p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="w-20 h-20 relative">
                    <div className="relative">
                      <X
                        size={16}
                        className="absolute top-0 right-0 cursor-pointer text-white bg-red-500 rounded-full"
                        onClick={() => {
                          // Remove image preview and corresponding file
                          setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
                          setImageFiles((prev) => prev.filter((_, i) => i !== idx));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_amount">
                Target Amount (₱) <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="end_date_picker">End Date (optional)</Label>
              <div className="relative flex gap-2">
                <Input
                  id="end_date_picker"
                  value={endDateValue}
                  placeholder="June 01, 2025"
                  className="bg-background pr-10"
                  onChange={(e) => {
                    const raw = e.target.value;
                    setEndDateValue(raw);
                    const d = new Date(raw);
                    if (isValidDate(d)) {
                      setEndDateObj(d);
                      setEndDateMonth(d);
                      handleInputChange('end_date', d.toISOString().split('T')[0]);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setEndDateOpen(true);
                    }
                  }}
                />
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="end_date_button"
                      variant="ghost"
                      type="button"
                      className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                      onClick={() => setEndDateOpen((o) => !o)}
                    >
                      <CalendarIcon className="size-3.5" />
                      <span className="sr-only">Select end date</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="end"
                    alignOffset={-8}
                    sideOffset={10}
                  >
                    <Calendar
                      mode="single"
                      selected={endDateObj}
                      captionLayout="dropdown"
                      month={endDateMonth}
                      onMonthChange={setEndDateMonth}
                      onSelect={(date) => {
                        setEndDateObj(date);
                        setEndDateValue(formatDisplayDate(date));
                        handleInputChange('end_date', date ? date.toISOString().split('T')[0] : '');
                        setEndDateOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for no end date. Campaign continues until target reached. Past dates
                disabled.
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

            {/* Bank Accounts Section */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Bank Accounts</h4>
                  <span className="text-xs text-gray-500">
                    ({formData.bank_accounts?.length || 0}/10)
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addBankAccount}
                  disabled={(formData.bank_accounts?.length || 0) >= 10}
                  className="h-8"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Bank
                </Button>
              </div>

              {formData.bank_accounts && formData.bank_accounts.length > 0 ? (
                <div className="space-y-3">
                  {formData.bank_accounts.map((account, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white dark:bg-gray-800 rounded border space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Bank Account {index + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBankAccount(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="e.g. BPI Savings"
                          value={account.label}
                          onChange={(e) => updateBankAccount(index, 'label', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Account number"
                          value={account.account_number}
                          onChange={(e) =>
                            updateBankAccount(index, 'account_number', e.target.value)
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          QR Code (optional)
                        </Label>
                        <div className="relative">
                          <input
                            id={`bank-qr-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleBankAccountQrCodeUpload(index, e.target.files)}
                            className="hidden"
                          />
                          <label
                            htmlFor={`bank-qr-${index}`}
                            className="flex items-center justify-center p-2 border-2 border-dashed rounded-lg cursor-pointer transition-all border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                          >
                            <QrCode className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {account.qr_code_file ? account.qr_code_file.name : 'Upload QR Code'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No bank accounts added. Click &quot;Add Bank&quot; to add payment options.
                </p>
              )}
            </div>

            {/* E-Wallets Section */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">E-Wallets</h4>
                  <span className="text-xs text-gray-500">
                    ({formData.e_wallets?.length || 0}/10)
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addEWallet}
                  disabled={(formData.e_wallets?.length || 0) >= 10}
                  className="h-8"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add E-Wallet
                </Button>
              </div>

              {formData.e_wallets && formData.e_wallets.length > 0 ? (
                <div className="space-y-3">
                  {formData.e_wallets.map((wallet, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white dark:bg-gray-800 rounded border space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">E-Wallet {index + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEWallet(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="e.g. Maya, GCash"
                          value={wallet.label}
                          onChange={(e) => updateEWallet(index, 'label', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Account number/mobile"
                          value={wallet.account_number}
                          onChange={(e) => updateEWallet(index, 'account_number', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          QR Code (optional)
                        </Label>
                        <div className="relative">
                          <input
                            id={`ewallet-qr-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleEWalletQrCodeUpload(index, e.target.files)}
                            className="hidden"
                          />
                          <label
                            htmlFor={`ewallet-qr-${index}`}
                            className="flex items-center justify-center p-2 border-2 border-dashed rounded-lg cursor-pointer transition-all border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                          >
                            <QrCode className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {wallet.qr_code_file ? wallet.qr_code_file.name : 'Upload QR Code'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No e-wallets added. Click &quot;Add E-Wallet&quot; to add payment options.
                </p>
              )}
            </div>

            {/* Links Section */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Campaign Links</h4>
                  <span className="text-xs text-gray-500">({formData.links?.length || 0}/10)</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addLink}
                  disabled={(formData.links?.length || 0) >= 10}
                  className="h-8"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Link
                </Button>
              </div>

              {formData.links && formData.links.length > 0 ? (
                <div className="space-y-2">
                  {formData.links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="https://example.com/campaign"
                        value={link}
                        onChange={(e) => updateLink(index, e.target.value)}
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLink(index)}
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No links added. Click &quot;Add Link&quot; to add related campaign URLs.
                </p>
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
