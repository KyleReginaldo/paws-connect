'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { User } from '../config/models/users';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';

interface UserTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  onStatusChange?: (userId: string, status: string) => void;
  onAddViolation?: (userId: string, violation: string) => void;
  onRemoveViolation?: (userId: string, violationIndex: number) => void;
  currentUserRole?: number; // Add current user role for permission checks
}

export function UserTable({
  users,
  onEdit,
  onDelete,
  onStatusChange,
  onAddViolation,
  onRemoveViolation,
  currentUserRole,
}: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-lg font-semibold mb-2">No users added yet</h3>
        <p className="text-muted-foreground">Add your first user to get started!</p>
      </div>
    );
  }

  // Permission helper
  const canManageUser = (targetUserRole: number) => {
    // Admins (role 1) can manage everyone
    if (currentUserRole === 1) return true;
    // Staff (role 2) cannot manage admins (role 1)
    if (currentUserRole === 2 && targetUserRole === 1) return false;
    // Staff can manage other staff and regular users
    return currentUserRole === 2;
  };

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'fully_verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'semi_verified':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'banned':
      case 'indefinite':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Violations</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        user.profile_image_link
                          ? user.profile_image_link
                          : `https://api.dicebear.com/7.x/initials/svg?seed=${user.username || 'Unknown'}`
                      }
                      alt={user.username || 'Unknown User'}
                    />
                    <AvatarFallback className="bg-muted">
                      {(user.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.username || 'Unknown User'}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {user.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone_number}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-medium">
                  {getRoleText(user.role)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
              </TableCell>
              <TableCell>
                {user.violations && user.violations.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {user.violations.length}
                    </Badge>
                    {currentUserRole === 1 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Violations for {selectedUser?.username || 'Unknown User'}
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-96">
                            <div className="space-y-3">
                              {selectedUser?.violations?.map((violation, index) => (
                                <div
                                  key={index}
                                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="text-sm text-red-800 flex-1">
                                      <span className="font-medium">#{index + 1}:</span> {violation}
                                    </div>
                                    {currentUserRole === 1 && onRemoveViolation && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              'Are you sure you want to remove this violation?',
                                            )
                                          ) {
                                            onRemoveViolation(selectedUser.id, index);
                                          }
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-red-200 text-red-600 hover:text-red-700 flex-shrink-0"
                                        title="Remove violation"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Clean
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">{formatDate(user.created_at)}</div>
              </TableCell>
              <TableCell>
                {user.role !== 1 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canManageUser(user.role) && (
                        <DropdownMenuItem onClick={() => onEdit?.(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canManageUser(user.role) && user.status !== 'FULLY_VERIFIED' && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange?.(user.id, 'FULLY_VERIFIED')}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Fully Verify
                        </DropdownMenuItem>
                      )}
                      {canManageUser(user.role) &&
                        user.role === 3 &&
                        user.status !== 'SEMI_VERIFIED' &&
                        user.status !== 'FULLY_VERIFIED' && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange?.(user.id, 'SEMI_VERIFIED')}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Semi Verified
                          </DropdownMenuItem>
                        )}
                      {canManageUser(user.role) && user.status !== 'INDEFINITE' && (
                        <DropdownMenuItem onClick={() => onStatusChange?.(user.id, 'INDEFINITE')}>
                          <UserX className="h-4 w-4 mr-2" />
                          Indefinite
                        </DropdownMenuItem>
                      )}
                      {currentUserRole === 1 && (
                        <DropdownMenuItem
                          onClick={() => {
                            const violation = prompt('Enter violation description:');
                            if (violation && violation.trim()) {
                              onAddViolation?.(user.id, violation.trim());
                            }
                          }}
                          className="text-orange-600"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Add Violation
                        </DropdownMenuItem>
                      )}
                      {canManageUser(user.role) &&
                        (user.status === 'INDEFINITE' || user.status === 'PENDING') && (
                          <DropdownMenuItem
                            onClick={() => onDelete?.(user.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
