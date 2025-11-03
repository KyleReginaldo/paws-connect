'use client';
import { useAuth } from '@/app/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

type ProfileFormValues = {
  username: string;
  phone_number: string;
  profile_image_link: string;
  bio?: string; // future use
};

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = useMemo(() => user?.username?.[0]?.toUpperCase() ?? 'U', [user?.username]);

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      username: user?.username ?? '',
      phone_number: user?.phone_number ?? '',
      profile_image_link: user?.profile_image_link ?? '',
      bio: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    // Sync form if user changes
    form.reset({
      username: user?.username ?? '',
      phone_number: user?.phone_number ?? '',
      profile_image_link: user?.profile_image_link ?? '',
      bio: '',
    });
  }, [user, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};

      if (values.username && values.username !== user.username) payload.username = values.username;
      if (values.phone_number && values.phone_number !== user.phone_number)
        payload.phone_number = values.phone_number;
      if (values.profile_image_link !== (user.profile_image_link ?? ''))
        payload.profile_image_link = values.profile_image_link || '';

      if (Object.keys(payload).length === 0) {
        setMessage('Nothing to update.');
        return;
      }

      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Failed to update profile');
      }
      setMessage('Profile updated successfully.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const onChangePassword = async () => {
    if (!user?.id) return;
    setPwdSaving(true);
    setMessage(null);
    setError(null);
    try {
      if (!currentPassword) throw new Error('Current password is required.');
      if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
      if (newPassword !== confirmPassword) throw new Error("Passwords don't match.");

      const res = await fetch('/api/v1/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to change password');
      setMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="size-14">
          {user?.profile_image_link ? (
            <AvatarImage src={user.profile_image_link} alt={user?.username ?? 'User'} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <p className="text-sm text-gray-500">Manage your profile information and password.</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <section className="rounded-lg border bg-white p-4 md:p-6">
          <h3 className="text-base font-medium mb-4">Profile</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+639123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="profile_image_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>Email</Label>
                <Input value={user?.email ?? ''} disabled className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">Email changes are not supported here.</p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={saving}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </section>

        <section className="rounded-lg border bg-white p-4 md:p-6">
          <h3 className="text-base font-medium mb-4">Change Password</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={onChangePassword} disabled={pwdSaving}>
              {pwdSaving ? 'Updating…' : 'Update Password'}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-4 md:p-6">
          <h3 className="text-base font-medium mb-4">Sign Out</h3>
          <p className="text-sm text-gray-600 mb-3">
            You will be signed out of the admin panel and redirected to the sign-in page.
          </p>
          <Button variant="destructive" onClick={() => setShowLogoutDialog(true)}>
            Sign Out
          </Button>
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign Out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out? You’ll need to log in again to access the admin
                  panel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    try {
                      await signOut();
                    } catch (e) {
                      console.error('Error during sign out:', e);
                      if (typeof window !== 'undefined') {
                        window.location.href = '/auth/signin';
                      }
                    }
                  }}
                >
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </div>
  );
}
