'use client';

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
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';

export interface ChatFilter {
  id: string;
  word: string;
  category: string;
  severity: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateChatFilterDto {
  word: string;
  category?: string;
  severity?: number;
  is_active?: boolean;
}

export interface UpdateChatFilterDto {
  word?: string;
  category?: string;
  severity?: number;
  is_active?: boolean;
}

interface ChatFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (filterData: CreateChatFilterDto | UpdateChatFilterDto) => Promise<void>;
  editingFilter?: ChatFilter | null;
}

const CATEGORIES = [
  { value: 'profanity', label: 'Profanity' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_LEVELS = [
  { value: 1, label: 'Low (Warning)' },
  { value: 2, label: 'Medium (Filter)' },
  { value: 3, label: 'High (Block)' },
];

export function ChatFilterModal({
  open,
  onOpenChange,
  onSubmit,
  editingFilter,
}: ChatFilterModalProps) {
  const [formData, setFormData] = useState<CreateChatFilterDto>({
    word: '',
    category: 'profanity',
    severity: 2,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingFilter) {
      setFormData({
        word: editingFilter.word || '',
        category: editingFilter.category || 'profanity',
        severity: editingFilter.severity || 2,
        is_active: editingFilter.is_active ?? true,
      });
    } else {
      setFormData({
        word: '',
        category: 'profanity',
        severity: 2,
        is_active: true,
      });
    }
    setFormError(null);
  }, [editingFilter, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    // Validate word
    if (!formData.word || formData.word.trim().length === 0) {
      setFormError('Word/phrase is required');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingFilter) {
        const updatePayload: UpdateChatFilterDto = {};
        if (formData.word && formData.word.trim() !== editingFilter.word) {
          updatePayload.word = formData.word.trim().toLowerCase();
        }
        if (formData.category && formData.category !== editingFilter.category) {
          updatePayload.category = formData.category;
        }
        if (formData.severity !== undefined && formData.severity !== editingFilter.severity) {
          updatePayload.severity = formData.severity;
        }
        if (formData.is_active !== editingFilter.is_active) {
          updatePayload.is_active = formData.is_active;
        }
        await onSubmit(updatePayload);
      } else {
        const createPayload: CreateChatFilterDto = {
          word: formData.word.trim().toLowerCase(),
          category: formData.category,
          severity: formData.severity,
          is_active: formData.is_active,
        };
        await onSubmit(createPayload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting filter data:', error);
      const message = error instanceof Error ? error.message : 'Failed to save filter.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateChatFilterDto,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingFilter ? 'Edit Chat Filter' : 'Add New Chat Filter'}</DialogTitle>
          <DialogDescription>
            {editingFilter
              ? 'Update the filter word and settings.'
              : 'Add a word or phrase to filter from chat messages.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="word">
                Word/Phrase<span className="text-red-500">*</span>
              </Label>
              <Input
                id="word"
                value={formData.word}
                onChange={(e) => handleInputChange('word', e.target.value)}
                placeholder="Enter word or phrase to filter"
                required
              />
              <p className="text-xs text-muted-foreground">
                Will be automatically converted to lowercase
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category<span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">
                Severity Level<span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.severity?.toString()}
                onValueChange={(value) => handleInputChange('severity', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Low: Warning only | Medium: Filter message | High: Block & warn user
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Filter</Label>
                <p className="text-xs text-muted-foreground">Enable or disable this filter</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
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
              {isSubmitting ? 'Saving...' : editingFilter ? 'Update Filter' : 'Create Filter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
