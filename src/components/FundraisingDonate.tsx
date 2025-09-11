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
  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error, warning } = useNotifications();

  const handleDonate = async () => {
    if (!amount) return warning('Enter an amount');
    const n = Number(amount);
    if (Number.isNaN(n) || n <= 0) return warning('Enter a valid amount');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundraising: Number(fundraisingId),
          amount: n,
          donor_name: donorName || null,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        error(json?.message || json?.error || 'Donation failed');
      } else {
        success('Donation successful');
        // reload to refresh server-rendered data
        window.location.reload();
      }
    } catch (err) {
      console.error('Donate error', err);
      error('Donation failed');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Donate</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Make a donation</h3>
          <div>
            <label className="text-sm block mb-1">Amount</label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Donor name (optional)</label>
            <Input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Name"
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
  );
}
