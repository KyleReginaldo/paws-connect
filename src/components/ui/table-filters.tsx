'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Filter, Search, X } from 'lucide-react';
import { useState } from 'react';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface TableFilter {
  id: string;
  label: string;
  type: 'search' | 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean';
  placeholder?: string;
  options?: FilterOption[];
  value?: any;
  disabled?: boolean;
}

export interface TableFiltersProps {
  filters: TableFilter[];
  onFiltersChange: (filters: Record<string, any>) => void;
  onClearAll?: () => void;
  className?: string;
}

export function TableFilters({
  filters,
  onFiltersChange,
  onClearAll,
  className,
}: TableFiltersProps) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [open, setOpen] = useState(false);

  const activeFiltersCount = Object.entries(filterValues).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some((v) => v !== undefined && v !== null && v !== '');
    }
    return value !== undefined && value !== null && value !== '';
  }).length;

  const updateFilter = (filterId: string, value: any) => {
    const newValues = { ...filterValues, [filterId]: value };
    setFilterValues(newValues);
    onFiltersChange(newValues);
  };

  const clearFilter = (filterId: string) => {
    const newValues = { ...filterValues };
    delete newValues[filterId];
    setFilterValues(newValues);
    onFiltersChange(newValues);
  };

  const clearAllFilters = () => {
    setFilterValues({});
    onFiltersChange({});
    onClearAll?.();
  };

  const searchFilters = filters.filter((f) => f.type === 'search');
  const otherFilters = filters.filter((f) => f.type !== 'search');

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Search Filters - Always visible */}
      {searchFilters.map((filter) => (
        <div key={filter.id} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={filter.placeholder || `Search...`}
            value={filterValues[filter.id] || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            className="pl-9 pr-9 h-9 w-80"
            disabled={filter.disabled}
          />
          {filterValues[filter.id] && (
            <button
              onClick={() => clearFilter(filter.id)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}

      {/* Filter Popup Button */}
      {otherFilters.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-2 h-9 px-3',
                activeFiltersCount > 0 && 'border-primary text-primary bg-primary/5',
              )}
            >
              <Filter className="h-4 w-4" />
              Filter
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-8 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {otherFilters.map((filter) => (
                <FilterControl
                  key={filter.id}
                  filter={filter}
                  value={filterValues[filter.id]}
                  onChange={(value) => updateFilter(filter.id, value)}
                  onClear={() => clearFilter(filter.id)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(filterValues).map(([filterId, value]) => {
            const filter = filters.find((f) => f.id === filterId);
            if (!filter || !value) return null;

            if (Array.isArray(value) && value.length === 0) return null;
            if (typeof value === 'object' && !Array.isArray(value)) {
              const hasValue = Object.values(value).some(
                (v) => v !== undefined && v !== null && v !== '',
              );
              if (!hasValue) return null;
            }

            return (
              <ActiveFilterBadge
                key={filterId}
                filter={filter}
                value={value}
                onClear={() => clearFilter(filterId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FilterControlProps {
  filter: TableFilter;
  value: any;
  onChange: (value: any) => void;
  onClear: () => void;
}

function FilterControl({ filter, value, onChange }: FilterControlProps) {
  switch (filter.type) {
    case 'select':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{filter.label}</Label>
          <Select value={value || ''} onValueChange={onChange} disabled={filter.disabled}>
            <SelectTrigger className="h-9">
              <SelectValue
                placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <Badge variant="outline" className="ml-2 h-4 px-1 text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'multiselect':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{filter.label}</Label>
          <div className="space-y-2">
            {filter.options?.map((option) => {
              const isSelected = value && value.includes(option.value);
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.id}-${option.value}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      const currentValue = value || [];
                      const newValue = checked
                        ? [...currentValue, option.value]
                        : currentValue.filter((v: string) => v !== option.value);
                      onChange(newValue);
                    }}
                    disabled={filter.disabled}
                  />
                  <Label
                    htmlFor={`${filter.id}-${option.value}`}
                    className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
                  >
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <Badge variant="outline" className="h-4 px-1 text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'boolean':
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={filter.id}
              checked={value || false}
              onCheckedChange={onChange}
              disabled={filter.disabled}
            />
            <Label htmlFor={filter.id} className="text-sm font-medium cursor-pointer">
              {filter.label}
            </Label>
          </div>
        </div>
      );

    case 'daterange':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{filter.label}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-9',
                  !value && 'text-muted-foreground',
                )}
                disabled={filter.disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value?.from ? (
                  value.to ? (
                    <>
                      {value.from.toLocaleDateString()} - {value.to.toLocaleDateString()}
                    </>
                  ) : (
                    value.from.toLocaleDateString()
                  )
                ) : (
                  filter.placeholder || 'Pick a date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={onChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      );

    default:
      return null;
  }
}

interface ActiveFilterBadgeProps {
  filter: TableFilter;
  value: any;
  onClear: () => void;
}

function ActiveFilterBadge({ filter, value, onClear }: ActiveFilterBadgeProps) {
  const getDisplayValue = () => {
    switch (filter.type) {
      case 'search':
        return `${filter.label}: "${value}"`;
      case 'select':
        const option = filter.options?.find((opt) => opt.value === value);
        return `${filter.label}: ${option?.label || value}`;
      case 'multiselect':
        if (Array.isArray(value) && value.length > 0) {
          return `${filter.label}: ${value.length} selected`;
        }
        return '';
      case 'boolean':
        return value ? filter.label : '';
      case 'daterange':
        if (value?.from) {
          return value.to
            ? `${filter.label}: ${value.from.toLocaleDateString()} - ${value.to.toLocaleDateString()}`
            : `${filter.label}: ${value.from.toLocaleDateString()}`;
        }
        return '';
      default:
        return `${filter.label}: ${value}`;
    }
  };

  const displayValue = getDisplayValue();
  if (!displayValue) return null;

  return (
    <Badge
      variant="secondary"
      className="gap-1 pr-1 h-6 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20"
    >
      {displayValue}
      <button onClick={onClear} className="ml-1 hover:bg-primary/20 rounded-full p-0.5">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
