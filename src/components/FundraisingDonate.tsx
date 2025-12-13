'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notification';
import { useState } from 'react';
import Tesseract from 'tesseract.js';

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
      };
      reader.readAsDataURL(file);
      // Automatically extract payment info
      extractPaymentInfo(file);
    }
  };

  const extractPaymentInfo = async (file: File) => {
    setExtracting(true);
    try {
      // Perform OCR directly in the browser using Tesseract.js
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => console.log('[Tesseract]', m.status, m.progress),
      });

      const text = result.data.text;
      console.log('[OCR] Extracted text:', text);

      // Extract payment information from the text
      const paymentInfo = extractPaymentInfoFromText(text);
      console.log('[OCR] Extraction result:', paymentInfo);

      // Auto-fill the form fields if values were extracted
      if (paymentInfo.amount) {
        setAmount(paymentInfo.amount);
        success('Amount extracted from image!');
      }
      if (paymentInfo.referenceNumber) {
        setReferenceNumber(paymentInfo.referenceNumber);
        success('Reference number extracted from image!');
      }
      if (!paymentInfo.amount && !paymentInfo.referenceNumber) {
        warning('Could not extract donation details from image');
      }
    } catch (err) {
      console.error('OCR extraction error:', err);
      warning('Failed to extract data from image');
      // Silently fail - user can still manually enter the values
    } finally {
      setExtracting(false);
    }
  };

  const extractPaymentInfoFromText = (
    text: string,
  ): {
    amount?: string;
    referenceNumber?: string;
  } => {
    const result: { amount?: string; referenceNumber?: string } = {};

    // Extract amount - look for patterns like: ₱15.00, PHP 15.00, 15.00
    const amountPatterns = [
      /₱\s*([\d,]+\.\d{2})/i,
      /PHP\s*([\d,]+\.\d{2})/i,
      /P\s*([\d,]+\.\d{2})/i,
      /amount[:\s]*₱?\s*([\d,]+\.\d{2})/i,
      /total[:\s]*₱?\s*([\d,]+\.\d{2})/i,
      /sent[:\s]*₱?\s*([\d,]+\.\d{2})/i,
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.amount = match[1].replace(/,/g, '');
        break;
      }
    }

    // Extract reference number - look for patterns like: Ref No. 3035 133 488780
    const refPatterns = [
      /ref(?:erence)?\s*(?:no\.?|number)?[:\s]*([\d\s]{10,})/i,
      /transaction\s*(?:id|number)?[:\s]*([A-Z0-9]{6,})/i,
      /confirmation[:\s]*([A-Z0-9]{6,})/i,
    ];

    for (const pattern of refPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.referenceNumber = match[1].trim().replace(/\s+/g, '');
        break;
      }
    }

    return result;
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
              <p className="italic text-[12px] mt-1 text-gray-500">
                Note: Please upload a clear image of your proof of donation for accurate analysis.
              </p>
              <p className="italic text-[12px] text-gray-500">
                Image extraction is not perfect and may require manual verification.
              </p>
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
