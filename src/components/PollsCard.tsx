'use client';

import { useAuth } from '@/app/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

interface Poll {
  id: number;
  suggested_name: string | null;
  created_by: string | null;
  created_at: string;
  votes: string[] | null;
}

export function PollsCard({ petId }: { petId: number }) {
  const { userId } = useAuth();
  const router = useRouter();
  const [polls, setPolls] = React.useState<Poll[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [acceptingId, setAcceptingId] = React.useState<number | null>(null);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');

  const loadPolls = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/poll?pet_id=${petId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch polls');
      setPolls(json.data ?? []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch polls';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  React.useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const onCreate = async () => {
    if (!userId) {
      toast.error('You must be signed in to create a poll.');
      return;
    }
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/v1/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet: petId, suggested_name: name.trim(), created_by: userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create poll');
      toast.success('Poll created');
      setName('');
      setOpen(false);
      await loadPolls();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create poll';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: number) => {
    const confirm = window.confirm('Delete this poll? This cannot be undone.');
    if (!confirm) return;
    try {
      const res = await fetch(`/api/v1/poll/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete poll');
      toast.success('Poll deleted');
      setPolls((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete poll';
      toast.error(message);
    }
  };

  const onAccept = async (id: number) => {
    setAcceptingId(id);
    try {
      const res = await fetch(`/api/v1/poll/${id}/accept`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to accept poll');
      toast.success('Pet name updated');
      await loadPolls();
      // Refresh server components so header name updates
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to accept poll';
      toast.error(message);
    } finally {
      setAcceptingId(null);
    }
  };

  const empty = !loading && (polls?.length ?? 0) === 0;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Polls</CardTitle>
            <CardDescription>Manage naming polls for this pet</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">New poll</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create poll</DialogTitle>
                <DialogDescription>Suggest a new name and start a poll.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Suggested name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Whiskers"
                />
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={onCreate} disabled={!name.trim() || creating}>
                  {creating ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading polls…</div>
        ) : empty ? (
          <div className="text-sm text-muted-foreground">No polls yet.</div>
        ) : (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Name</TableHead>
                  <TableHead className="w-[20%]">Votes</TableHead>
                  <TableHead className="w-[30%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polls!.map((poll) => (
                  <TableRow key={poll.id}>
                    <TableCell className="font-medium">
                      {poll.suggested_name ?? '—'}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(poll.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{poll.votes?.length ?? 0} votes</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => onAccept(poll.id)}
                          disabled={acceptingId === poll.id}
                        >
                          {acceptingId === poll.id ? 'Accepting…' : 'Accept'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onDelete(poll.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Separator className="my-4" />
        <div className="text-xs text-muted-foreground">
          Only admins/staff can create, accept, or delete polls.
        </div>
      </CardContent>
    </Card>
  );
}
