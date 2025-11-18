import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date/time helpers centralized for consistent display across the app

function parseDateSafe(input: Date | string): Date | null {
  try {
    const d = typeof input === 'string' ? input.trim() : input;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
    let s = d as string;
    if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T');
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export function toManilaIso(input?: Date | string): string {
  const date = input ? parseDateSafe(input) : new Date();
  const d = date ?? new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
  const y = get('year');
  const m = get('month');
  const day = get('day');
  const hh = get('hour');
  const mm = get('minute');
  const ss = get('second');
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}+08:00`;
}

export function formatManilaHM(input: Date | string): string {
  const d = parseDateSafe(input);
  if (!d) return 'Invalid Date';
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    }).format(d);
  } catch {
    return 'Invalid Date';
  }
}

