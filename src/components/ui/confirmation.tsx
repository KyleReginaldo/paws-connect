'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, HelpCircle, Info } from 'lucide-react';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './dialog';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'question';

export interface ConfirmationOptions {
  title: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within ConfirmationProvider');
  }
  return context;
}

interface ConfirmationState {
  isOpen: boolean;
  options: ConfirmationOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmationState | null>(null);

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (state) {
      state.resolve(true);
      setState(null);
    }
  };

  const handleCancel = () => {
    if (state) {
      state.resolve(false);
      setState(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  const icons = {
    danger: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    question: HelpCircle,
  };

  const iconColors = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    question: 'text-gray-600',
  };

  const options = state?.options;
  const type = options?.type || 'question';
  const Icon = icons[type];

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={state?.isOpen || false} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Icon className={cn('h-6 w-6', iconColors[type])} />
              {options?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{options?.message}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {options?.cancelText || 'Cancel'}
            </Button>
            <Button
              variant={options?.confirmVariant || (type === 'danger' ? 'destructive' : 'default')}
              onClick={handleConfirm}
            >
              {options?.confirmText || 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmationContext.Provider>
  );
}
