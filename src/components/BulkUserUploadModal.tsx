'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileDown, Info, Upload as UploadIcon, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

export interface BulkUserDraft {
  rowNumber: number;
  username?: string;
  email?: string;
  phone_number?: string;
  role?: number;
  status?: string;
  password?: string;
}

export interface BulkUploadResult {
  successes: { rowNumber: number; identifier: string }[];
  failures: { rowNumber: number; identifier: string; message: string }[];
}

interface ExistingUserIdentifier {
  username?: string | null;
  email?: string | null;
  phone_number?: string | null;
}

interface BulkUserUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (drafts: BulkUserDraft[]) => Promise<BulkUploadResult>;
  result: BulkUploadResult | null;
  canCreateAdmin: boolean;
  existingUsers?: ExistingUserIdentifier[];
}

const SUPPORTED_STATUSES = ['PENDING', 'SEMI_VERIFIED', 'FULLY_VERIFIED', 'INDEFINITE'];

const TEMPLATE_ROWS: BulkUserDraft[] = [
  {
    rowNumber: 2,
    username: 'janedoe',
    email: 'janedoe@example.com',
    phone_number: '+639123456789',
    role: 3,
    status: 'PENDING',
    password: 'optionalStrongPassword1!',
  },
  {
    rowNumber: 3,
    username: 'adminsample',
    email: 'admin@example.com',
    phone_number: '+639987654321',
    role: 1,
    status: 'FULLY_VERIFIED',
    password: 'AdminSecurePass1!',
  },
];

const normalizeEmailValue = (value: string) => value.trim().toLowerCase();
const normalizeUsernameValue = (value: string) => value.trim().toLowerCase();
const normalizePhoneValue = (value: string) => value.replace(/\D+/g, '');

export function BulkUserUploadModal({
  open,
  onOpenChange,
  onSubmit,
  result,
  canCreateAdmin,
  existingUsers = [],
}: BulkUserUploadModalProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<BulkUserDraft[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const hasPreview = drafts.length > 0;
  const hasResult = !!result && (result.successes.length > 0 || result.failures.length > 0);

  const existingIdentifierSets = useMemo(() => {
    const emailSet = new Set<string>();
    const usernameSet = new Set<string>();
    const phoneSet = new Set<string>();

    existingUsers.forEach(({ email, username, phone_number }) => {
      if (email) {
        emailSet.add(normalizeEmailValue(email));
      }
      if (username) {
        usernameSet.add(normalizeUsernameValue(username));
      }
      if (phone_number) {
        phoneSet.add(normalizePhoneValue(phone_number));
      }
    });

    return {
      emailSet,
      usernameSet,
      phoneSet,
    };
  }, [existingUsers]);

  useEffect(() => {
    if (!open) {
      setDrafts([]);
      setFileError(null);
      setFileName(null);
    }
  }, [open]);

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      TEMPLATE_ROWS.map((row) => ({
        username: row.username,
        email: row.email,
        phone_number: row.phone_number,
        role: row.role,
        status: row.status,
        password: row.password,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'users');
    XLSX.writeFile(workbook, 'bulk-users-template.xlsx');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    setDrafts([]);

    if (!file) {
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
      setFileError('Unsupported file type. Please upload a .xlsx, .xls, or .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        const parsedDrafts: BulkUserDraft[] = json
          .map((row, index) => mapRowToDraft(row, index + 2))
          .filter((draft) =>
            Boolean(
              (draft.username && draft.username.trim()) ||
                (draft.email && draft.email.trim()) ||
                (draft.phone_number && draft.phone_number.trim()),
            ),
          );

        if (!parsedDrafts.length) {
          setFileError(
            'No valid rows found. Please ensure the sheet has data below the header row.',
          );
          setDrafts([]);
          setFileName(null);
          return;
        }

        setDrafts(parsedDrafts);
        setFileName(file.name);
      } catch (error) {
        console.error('Failed to parse uploaded file:', error);
        setFileError('Failed to parse file. Please double-check the format and try again.');
        setDrafts([]);
        setFileName(null);
      }
    };

    reader.onerror = () => {
      setFileError('Unable to read file. Please try again.');
      setDrafts([]);
      setFileName(null);
    };

    reader.readAsArrayBuffer(file);
  };

  const hasValidationIssues = useMemo(() => {
    return drafts.some((draft) => !draft.username || !draft.email || !draft.phone_number);
  }, [drafts]);

  const sanitizedDrafts = useMemo(() => {
    return drafts.map((draft) => ({
      ...draft,
      status: draft.status && SUPPORTED_STATUSES.includes(draft.status) ? draft.status : undefined,
      role: draft.role === 1 ? 1 : 3,
    }));
  }, [drafts]);

  type DuplicateField = 'username' | 'email' | 'phone_number';

  const duplicateLookup = useMemo(() => {
    const duplicates = new Map<number, { fields: DuplicateField[] }>();

    sanitizedDrafts.forEach((draft) => {
      const duplicatedFields: DuplicateField[] = [];

      if (
        draft.username &&
        existingIdentifierSets.usernameSet.has(normalizeUsernameValue(draft.username))
      ) {
        duplicatedFields.push('username');
      }

      if (draft.email && existingIdentifierSets.emailSet.has(normalizeEmailValue(draft.email))) {
        duplicatedFields.push('email');
      }

      if (
        draft.phone_number &&
        existingIdentifierSets.phoneSet.has(normalizePhoneValue(draft.phone_number))
      ) {
        duplicatedFields.push('phone_number');
      }

      if (duplicatedFields.length > 0) {
        duplicates.set(draft.rowNumber, { fields: duplicatedFields });
      }
    });

    return duplicates;
  }, [existingIdentifierSets, sanitizedDrafts]);

  const handleSubmit = async () => {
    if (!sanitizedDrafts.length) return;
    setIsProcessing(true);
    try {
      await onSubmit(sanitizedDrafts);
    } catch (error) {
      console.error('Bulk user upload failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[720px] max-h-[85vh] overflow-hidden"
      >
        <DialogHeader className="text-left">
          <div className="space-y-1">
            <div className="flex justify-between">
              <DialogTitle>Import Users</DialogTitle>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-2 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
            <DialogDescription>
              Upload a spreadsheet with user details. We generate strong passwords automatically
              when omitted.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1 max-h-[55vh] sm:max-h-[60vh]">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-6 w-6" />
            <p className="leading-relaxed">
              Required columns: <code className="font-bold">username</code>,{' '}
              <code className="font-bold">email</code>,{' '}
              <code className="font-bold">phone_number</code>. Optional: <code>role</code> (1 for
              admin, 3 for user), <code>status</code>
              {` (${SUPPORTED_STATUSES.join(', ')})`}, and <code>password</code>.
            </p>
          </div>

          {!canCreateAdmin && (
            <p className="text-xs text-orange-600">
              Admin accounts can only be created by super administrators. Rows with{' '}
              <code>role = 1</code>
              will be saved as regular users.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-col gap-2">
              <label
                className="text-xs uppercase tracking-wide text-muted-foreground"
                htmlFor="bulk-users-file"
              >
                Upload file
              </label>
              <label
                htmlFor="bulk-users-file"
                className="inline-flex w-full cursor-pointer items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-sm transition-colors hover:border-muted-foreground"
              >
                <UploadIcon className="h-4 w-4" />
                <span className="truncate">{fileName ?? 'Choose CSV or Excel file'}</span>
              </label>
              <Input
                id="bulk-users-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={downloadTemplate}
                size="sm"
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Template
              </Button>
              {fileName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDrafts([]);
                    setFileName(null);
                    setFileError(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {fileError && (
            <Alert variant="destructive">
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          {hasPreview && (
            <div className="space-y-2">
              <div className="rounded-md border bg-background">
                <div className="max-h-56 overflow-auto">
                  <div className="min-w-[640px] overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-1 text-left font-medium text-muted-foreground">
                            Row
                          </th>
                          <th className="px-3 py-1 text-left font-medium text-muted-foreground">
                            Username
                          </th>
                          <th className="px-3 py-1 text-left font-medium text-muted-foreground">
                            Email
                          </th>
                          <th className="px-3 py-1 text-left font-medium text-muted-foreground">
                            Phone
                          </th>
                          <th className="px-3 py-1 text-left font-medium text-muted-foreground">
                            Role
                          </th>
                          <th className="px-3 py-1 text-left font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="px-3 py-1 text-left font-medium text-muted-foreground">
                            Password
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sanitizedDrafts.map((draft) => {
                          const duplicateInfo = duplicateLookup.get(draft.rowNumber);
                          const duplicateFields = duplicateInfo?.fields ?? [];

                          return (
                            <tr
                              key={draft.rowNumber}
                              className={cn(
                                'border-b last:border-none',
                                duplicateFields.length > 0 && 'bg-amber-50',
                              )}
                            >
                              <td className="px-3 py-1 whitespace-nowrap">
                                {draft.rowNumber}
                                {duplicateFields.length > 0 && (
                                  <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900">
                                    Existing
                                  </span>
                                )}
                              </td>
                              <td
                                className={cn(
                                  'px-3 py-1 break-all',
                                  !draft.username && 'text-red-600',
                                  duplicateFields.includes('username') &&
                                    'text-amber-700 font-medium',
                                )}
                              >
                                {draft.username || '—'}
                              </td>
                              <td
                                className={cn(
                                  'px-3 py-1 break-all',
                                  !draft.email && 'text-red-600',
                                  duplicateFields.includes('email') && 'text-amber-700 font-medium',
                                )}
                              >
                                {draft.email || '—'}
                              </td>
                              <td
                                className={cn(
                                  'px-3 py-1 break-all',
                                  !draft.phone_number && 'text-red-600',
                                  duplicateFields.includes('phone_number') &&
                                    'text-amber-700 font-medium',
                                )}
                              >
                                {draft.phone_number || '—'}
                              </td>
                              <td className="px-3 py-1 whitespace-nowrap">
                                {draft.role === 1 ? (canCreateAdmin ? 'Admin' : 'User*') : 'User'}
                              </td>
                              <td className="px-3 py-1 whitespace-nowrap">
                                {draft.status || 'Default'}
                              </td>
                              <td className="px-3 py-1 whitespace-nowrap">
                                {draft.password ? 'Provided' : 'Auto'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasResult && (
            <div className="space-y-2 border-t border-muted-foreground/10 pt-3 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">
                  {result?.successes.length ?? 0} created
                </span>
                {result?.successes.length
                  ? ` — ${result.successes
                      .slice(0, 3)
                      .map((item) => item.identifier)
                      .join(', ')}${result.successes.length > 3 ? '…' : ''}`
                  : ''}
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {result?.failures.length ?? 0} failed
                </span>
                {result?.failures.length
                  ? ` — ${result.failures
                      .slice(0, 3)
                      .map((item) => `${item.identifier}: ${item.message}`)
                      .join(' • ')}${result.failures.length > 3 ? '…' : ''}`
                  : ''}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!sanitizedDrafts.length || isProcessing}
          >
            {isProcessing ? 'Processing…' : 'Import Users'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function mapRowToDraft(row: Record<string, unknown>, rowNumber: number): BulkUserDraft {
  const findValue = (targetKey: string): unknown => {
    const normalizedTarget = targetKey.replace(/\s+|_/g, '').toLowerCase();

    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.replace(/\s+|_/g, '').toLowerCase();
      if (normalizedKey === normalizedTarget) {
        return value;
      }
    }

    return undefined;
  };

  const getString = (key: string): string | undefined => {
    const value = findValue(key);
    if (value === undefined || value === null) return undefined;
    const str = String(value).trim();
    return str.length ? str : undefined;
  };

  const getNumber = (key: string): number | undefined => {
    const raw = findValue(key);
    if (raw === undefined || raw === null || raw === '') return undefined;
    const num = Number(raw);
    return Number.isNaN(num) ? undefined : num;
  };

  const draft: BulkUserDraft = {
    rowNumber,
    username: getString('username'),
    email: getString('email'),
    phone_number: getString('phone_number') || getString('phone'),
    role: getNumber('role'),
    status: getString('status')?.toUpperCase(),
    password: getString('password'),
  };

  return draft;
}
