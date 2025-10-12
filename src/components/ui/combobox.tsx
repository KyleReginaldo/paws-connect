'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  options: { value: string; label: string; image?: string }[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No option found.',
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0">
            {value && options.find((option) => option.value === value)?.image && (
              <img
                src={options.find((option) => option.value === value)?.image}
                alt={options.find((option) => option.value === value)?.label}
                className="h-6 w-6 rounded object-cover shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <span className="truncate">
              {value ? options.find((option) => option.value === value)?.label : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="flex items-center border-b px-3">
          <input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm">{emptyText}</div>
        ) : (
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                onClick={() => {
                  onValueChange(option.value === value ? '' : option.value);
                  setOpen(false);
                  setSearch('');
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    value === option.value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {option.image && (
                  <img
                    src={option.image}
                    alt={option.label}
                    className="h-7 w-7 rounded object-cover shrink-0"
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span className="truncate">{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
