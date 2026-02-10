'use client';

import type { User } from '@/components/../config/models/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notification';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { transformUrlForLocalhost, transformUrlsForLocalhost } from '@/lib/url-utils';
import {
  AlertTriangle,
  FileSearch,
  Loader2,
  ShieldCheck,
  ShieldQuestion,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PhotoViewer } from './PhotoViewer';

type Identification = {
  id?: string;
  user?: string;
  id_attachment_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  middle_initial?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  id_name?: string | null;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string | null;
  created_at?: string;
};

type Address = {
  id?: number;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean | null;
  created_at?: string;
};

type UserWithId = User & {
  user_identification?: Identification | null;
  address?: Address[] | null;
};

interface UserDetailsApiResponse {
  message: string;
  data: UserWithId | null;
}

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  currentUserRole?: number;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  onStatusChange?: (userId: string, status: string) => void;
  onAddViolation?: (userId: string, violation: string) => void;
  onRemoveViolation?: (userId: string, violationIndex: number) => void;
}

export function UserDetailsSheet({
  open,
  onOpenChange,
  user,
  currentUserRole,
  onEdit,
  onDelete,
  onStatusChange,
  onAddViolation,
  onRemoveViolation,
}: UserDetailsSheetProps) {
  const [details, setDetails] = useState<UserWithId | null>(null);
  // Track loading if needed for future enhancements
  // const [loading, setLoading] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [addViolationOpen, setAddViolationOpen] = useState(false);
  const [violationInput, setViolationInput] = useState('');
  const { success, error: showError } = useNotifications();

  const canManageUser = useMemo(() => currentUserRole === 1, [currentUserRole]);

  console.log('UserDetailsSheet render:', { open, user: user?.username || 'no user' });

  useEffect(() => {
    let ignore = false;
    const fetchDetails = async () => {
      if (!open) return;
      // setLoading(true);
      try {
        const res = await fetch(`/api/v1/users/${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch user details');
        const json: UserDetailsApiResponse = await res.json();
        if (!ignore) setDetails(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        // if (!ignore) setLoading(false);
      }
    };
    fetchDetails();
    return () => {
      ignore = true;
    };
  }, [open, user.id]);

  const getRoleText = (role: number) => {
    switch (role) {
      case 1:
        return 'Admin';
      case 2:
        return 'Staff';
      case 3:
        return 'User';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      fully_verified: 'bg-green-100 text-green-800 border-green-200',
      semi_verified: 'bg-blue-100 text-blue-800 border-blue-200',
      inactive: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      banned: 'bg-red-100 text-red-800 border-red-200',
      indefinite: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return map[s] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const u: UserWithId = (details as UserWithId) || (user as UserWithId);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isActionLoading) return; // prevent closing while processing
    onOpenChange(nextOpen);
  };

  const statusLabelMap: Record<string, string> = {
    FULLY_VERIFIED: 'Fully verified',
    SEMI_VERIFIED: 'Semi verified',
    INDEFINITE: 'Indefinite',
  };

  async function handleStatusChange(newStatus: 'FULLY_VERIFIED' | 'SEMI_VERIFIED' | 'INDEFINITE') {
    try {
      setIsActionLoading(true);
      const maybePromise = onStatusChange?.(u.id, newStatus);
      // Await if the handler returns a Promise; otherwise continue after a short tick
      if (maybePromise && typeof maybePromise === 'object' && 'then' in maybePromise) {
        await (maybePromise as Promise<unknown>);
      } else {
        // Small delay to show feedback even for sync handlers
        await new Promise((r) => setTimeout(r, 600));
      }
      success(
        'User status updated',
        `${u.username || 'User'} is now ${statusLabelMap[newStatus]}.`,
      );
      // Close the sheet after completion
      onOpenChange(false);
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Please try again.';
      showError('Failed to update status', errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>User details</SheetTitle>
          <SheetDescription>Review identification and manage account</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-4 pb-4 space-y-4">
            {/* Header user summary */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={
                    transformUrlForLocalhost(u.profile_image_link) ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${u.username || 'Unknown'}`
                  }
                  alt={u.username || 'Unknown User'}
                />
                <AvatarFallback className="bg-muted">
                  {(u.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold truncate">{u.username || 'Unknown User'}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-medium">
                    {getRoleText(u.role)}
                  </Badge>
                  <Badge className={getStatusBadge(u.status)}>{u.status}</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Identification */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Identification</h3>
                {u?.user_identification?.status && (
                  <Badge variant="outline">{u.user_identification.status}</Badge>
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="space-y-3">
                  <div>
                    <div className="text-muted-foreground text-xs">First name</div>
                    <div className="font-medium">{u.user_identification?.first_name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Last name</div>
                    <div className="font-medium">{u.user_identification?.last_name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Middle initial</div>
                    <div className="font-medium">
                      {u.user_identification?.middle_initial || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Birth date</div>
                    <div className="font-medium">
                      {formatDate(u.user_identification?.date_of_birth)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">ID address</div>
                    <div className="font-medium break-words">
                      {u.user_identification?.address || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Current address</div>
                    <div className="font-medium break-words">
                      {u.address && u.address.length > 0 && u.address[0]
                        ? [
                            u.address[0].street,
                            u.address[0].city,
                            u.address[0].state,
                            u.address[0].zip_code,
                            u.address[0].country,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (u.user_identification?.id_attachment_url) {
                        setPhotoUrl(u.user_identification.id_attachment_url);
                        setPhotoOpen(true);
                      }
                    }}
                    disabled={!u.user_identification?.id_attachment_url}
                  >
                    <FileSearch className="h-4 w-4 mr-2" /> View ID attachment
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* House images */}
            <div>
              <h3 className="text-sm font-medium mb-2">Home assessment photos</h3>
              {u.house_images && u.house_images.length > 0 ? (
                <ScrollArea className="h-48 rounded border">
                  <div className="flex flex-wrap gap-2 p-2">
                    {transformUrlsForLocalhost(u.house_images).map((src, idx) => (
                      <button
                        key={idx}
                        className="relative h-24 w-22 overflow-hidden rounded border"
                        onClick={() => {
                          setPhotoUrl(src);
                          setPhotoOpen(true);
                        }}
                        aria-label={`Open home photo ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Home photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-xs text-muted-foreground">No house images submitted</div>
              )}
            </div>

            <Separator />

            {/* Violations */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Violations</h3>
                {canManageUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViolationInput('');
                      setAddViolationOpen(true);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" /> Add violation
                  </Button>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {u.violations && u.violations.length > 0 ? (
                  u.violations.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 rounded-md border p-2 bg-red-50 border-red-200"
                    >
                      <div className="text-sm text-red-800 flex-1">
                        <span className="font-medium">#{i + 1}:</span> {v}
                      </div>
                      {canManageUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveViolation?.(u.id, i)}
                          className="h-6 px-2 text-red-600 hover:text-red-700"
                          title="Remove violation"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground">No violations</div>
                )}
              </div>
            </div>

            <Separator />

            {/* Quick actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Quick actions</h3>
              <div className="flex flex-wrap gap-2">
                {canManageUser && (
                  <>
                    {u.status !== 'FULLY_VERIFIED' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange('FULLY_VERIFIED')}
                        disabled={isActionLoading}
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" /> Fully verify
                      </Button>
                    )}
                    {u.role === 3 &&
                      u.status !== 'SEMI_VERIFIED' &&
                      u.status !== 'FULLY_VERIFIED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStatusChange('SEMI_VERIFIED')}
                          disabled={isActionLoading}
                        >
                          <ShieldQuestion className="h-4 w-4 mr-2" /> Semi verify
                        </Button>
                      )}
                    {u.status !== 'INDEFINITE' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusChange('INDEFINITE')}
                        disabled={isActionLoading}
                      >
                        <UserX className="h-4 w-4 mr-2" /> Indefinite
                      </Button>
                    )}
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => onEdit?.(user)}>
                  <UserCheck className="h-4 w-4 mr-2" /> Edit
                </Button>
                {canManageUser && (
                  <Button variant="outline" size="sm" onClick={() => onDelete?.(user.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-shrink-0 px-4">
          <div className="text-xs text-muted-foreground">
            Joined {formatDate(u.created_at)} • Phone: {u.phone_number || '—'}
          </div>
        </SheetFooter>

        {/* Photo viewer reused for both ID and house images */}
        <PhotoViewer
          open={photoOpen}
          onOpenChange={setPhotoOpen}
          photoUrl={photoUrl}
          petName={u.username || 'user'}
        />

        {isActionLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-md border bg-background px-4 py-2 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Processing…</span>
            </div>
          </div>
        )}
      </SheetContent>

      {/* Add Violation Dialog */}
      <Dialog open={addViolationOpen} onOpenChange={setAddViolationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Add Violation for {details?.username || user.username || 'User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="violation-input" className="text-sm font-medium text-foreground">
                Violation Description
              </label>
              <textarea
                id="violation-input"
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                placeholder="Enter the violation description..."
                value={violationInput}
                onChange={(e) => setViolationInput(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This will be added to the user's violation history.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddViolationOpen(false);
                setViolationInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                if (violationInput.trim()) {
                  onAddViolation?.(user.id, violationInput.trim());
                  setAddViolationOpen(false);
                  setViolationInput('');
                }
              }}
              disabled={!violationInput.trim()}
            >
              Add Violation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

export default UserDetailsSheet;
