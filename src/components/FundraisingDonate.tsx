'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notification';
import { useState } from 'react';

interface Props {
  fundraisingId: number | string;
}

export default function FundraisingDonate({ fundraisingId }: Props) {
  const [open, setOpen] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const { success, error, warning } = useNotifications();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        warning('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        warning('Image size should be less than 5MB');
        return;
      }
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String);
        // Automatically extract payment info
        extractPaymentInfo(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractPaymentInfo = async (base64Image: string) => {
    setExtracting(true);
    try {
      const res = await fetch('/api/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        console.error('OCR failed:', res.status);
        return;
      }

      const json = await res.json();
      if (json.success && json.data) {
        // Auto-fill the form fields if values were extracted
        if (json.data.amount) {
          setAmount(json.data.amount);
          success('Amount extracted from image!');
        }
        if (json.data.referenceNumber) {
          setReferenceNumber(json.data.referenceNumber);
          success('Reference number extracted from image!');
        }
        if (!json.data.amount && !json.data.referenceNumber) {
          warning('Could not extract donation details from image');
        }
      }
    } catch (err) {
      console.error('OCR extraction error:', err);
      // Silently fail - user can still manually enter the values
    } finally {
      setExtracting(false);
    }
  };

  const handleDonate = async () => {
    if (!previewUrl) return warning('Please upload proof of donation');
    if (!amount) return warning('Enter an amount');
    const n = Number(amount);
    if (Number.isNaN(n) || n <= 0) return warning('Enter a valid amount');
    setLoading(true);
    try {
      const payload: {
        fundraising: number;
        amount: number;
        reference_number?: string;
        screenshot?: string;
      } = {
        fundraising: Number(fundraisingId),
        amount: n,
      };

      if (referenceNumber) {
        payload.reference_number = referenceNumber;
      }

      if (previewUrl) {
        payload.screenshot = previewUrl;
      }

      const res = await fetch('/api/v1/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        error(json?.message || json?.error || 'Donation failed');
      } else {
        setOpen(false);
        setShowThankYou(true);
      }
    } catch (err) {
      console.error('Donate error', err);
      error('Donation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
    // Reset form
    setAmount('');
    setReferenceNumber('');
    setProofImage(null);
    setPreviewUrl(null);
    // Reload to refresh server-rendered data
    window.location.reload();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)}>Donate</Button>
        </DialogTrigger>
        <DialogContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Make a donation</h3>
            <div>
              <label className="text-sm block mb-1">
                Proof of Donation
                {extracting && (
                  <span className="ml-2 text-xs text-blue-500">Analyzing image...</span>
                )}
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
                disabled={extracting}
              />
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Proof preview"
                    className="max-w-full h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm block mb-1">Amount</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Reference Number</label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. 123456789"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleDonate} disabled={loading}>
                {loading ? 'Processing...' : 'Donate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thank You Dialog */}
      <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4 text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Thank You!</h3>
            <p className="text-gray-600">
              Your generous donation of <span className="font-semibold">₱{amount}</span> has been
              received successfully.
            </p>
            <p className="text-sm text-gray-500">
              Your contribution will make a real difference in helping animals in need.
            </p>
            <Button onClick={handleThankYouClose} className="w-full mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
