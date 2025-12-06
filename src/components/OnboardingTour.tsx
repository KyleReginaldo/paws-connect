'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type Step = {
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    title: 'Welcome to PawsConnect',
    description:
      'Find pets to love, manage events, and support fundraising efforts all in one place.',
  },
  {
    title: 'Dashboard overview',
    description:
      'Your dashboard shows recent activity, stats, and quick actions to manage pets and campaigns.',
  },
  {
    title: 'Need help?',
    description:
      'Explore the FAQ and tooltips across the app. You can always revisit onboarding from settings.',
  },
];

export default function OnboardingTour() {
  const { user, markOnboarded } = useAuth();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const storageKey = useMemo(
    () => (user?.id ? `pc_onboarded_${user.id}` : 'pc_onboarded_guest'),
    [user?.id],
  );

  useEffect(() => {
    const localDone =
      typeof window !== 'undefined' ? localStorage.getItem(storageKey) === '1' : false;
    if (
      !localDone &&
      user &&
      (user.onboarded === false || user.onboarded === null || user.onboarded === undefined)
    ) {
      setOpen(true);
    }
  }, [user, storageKey]);

  const closeAndPersist = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, '1');
      }
      await markOnboarded();
    } finally {
      setOpen(false);
    }
  };

  if (!open) return null;

  const step = steps[index];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeAndPersist()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          {index > 0 && (
            <Button variant="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
              Back
            </Button>
          )}
          {index < steps.length - 1 ? (
            <Button onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}>Next</Button>
          ) : (
            <Button onClick={closeAndPersist}>Finish</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
