'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Input } from './input';

interface DateInputProps {
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export const DateInput: React.FC<DateInputProps> = ({ value, onChange, className }) => {
  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      onChange(newDate);
    }
  };

  return (
    <Input
      type="date"
      value={formatDateForInput(value)}
      onChange={handleChange}
      className={cn('w-[140px]', className)}
    />
  );
};
