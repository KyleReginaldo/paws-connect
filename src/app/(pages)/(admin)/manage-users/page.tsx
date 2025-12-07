'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useUsers } from '@/app/context/UsersContext';
import {
  BulkUserUploadModal,
  type BulkUploadResult,
  type BulkUserDraft,
} from '@/components/BulkUserUploadModal';
import { UserModal } from '@/components/UserModal';
import { UserTableFiltered } from '@/components/UserTableFiltered';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notification';
import { User } from '@/config/models/users';
import { CreateUserDto, UpdateUserDto } from '@/config/schema/userChema';
import { Download, Plus, RefreshCw, Shield, Upload, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

const ManageStaff = () => {
  const { userId, userRole } = useAuth();
  const { users, addUser, updateUser, deleteUser, updateUserStatus, refreshUsers } = useUsers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userStatusChanging, setUserStatusChanging] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);

  const { warning, success: notifySuccess, error: notifyError } = useNotifications();

  const canManageUser = (targetUserRole: number) => {
    if (userRole === 1) return true;
    if (userRole === 2 && targetUserRole === 1) return false;
    return userRole === 2;
  };

  const canCreateAdmin = () => {
    return userRole === 1;
  };

  const openEditModal = (user: User) => {
    if (!canManageUser(user.role)) {
      warning('You do not have permission to edit admin users.');
      return;
    }
    setEditingUser(user);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openBulkModal = () => {
    setBulkResult(null);
    setBulkModalOpen(true);
  };

  const handleExport = () => {
    if (!users) return;
    const exportData = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      phone_number: u.phone_number,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'users');
    const currentDate = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `users_${currentDate}.xlsx`);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshUsers();
    } catch (err) {
      warning(`Failed to refresh users: ${(err as Error)?.message ?? 'Unknown error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (userId === id) {
      warning('You cannot delete your own account while logged in.');
      return;
    }

    const userToDelete = users?.find((u) => u.id === id);
    if (!userToDelete) {
      warning('User not found.');
      return;
    }

    if (!canManageUser(userToDelete.role)) {
      warning('You do not have permission to delete admin users.');
      return;
    }

    await deleteUser(id);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUserStatusChanging(id);
    const userToUpdate = users?.find((u) => u.id === id);
    if (!userToUpdate) {
      warning('User not found.');
      setUserStatusChanging(null);
      return;
    }

    if (!canManageUser(userToUpdate.role)) {
      warning('You do not have permission to change admin user status.');
      setUserStatusChanging(null);
      return;
    }

    await updateUserStatus(id, newStatus).then(() => setUserStatusChanging(null));
  };

  const handleAddViolation = async (targetUserId: string, violation: string) => {
    try {
      if (!targetUserId || !violation.trim()) {
        warning('Invalid user ID or violation description.');
        return;
      }

      const response = await fetch(`/api/v1/users/${targetUserId}/violations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          violation: violation.trim(),
          admin_id: userId, // Current logged-in user (admin) who is adding the violation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add violation');
      }

      await response.json();

      await refreshUsers();
    } catch (error) {
      warning(
        `Failed to add violation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  const handleRemoveViolation = async (targetUserId: string, violationIndex: number) => {
    try {
      if (!targetUserId || violationIndex < 0) {
        warning('Invalid user ID or violation index.');
        return;
      }

      const response = await fetch(`/api/v1/users/${targetUserId}/violations`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          violation_index: violationIndex,
          admin_id: userId, // Current logged-in user (admin) who is removing the violation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove violation');
      }

      await response.json();

      await refreshUsers();
    } catch (error) {
      warning(
        `Failed to remove violation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  const totalUsers = users?.length || 0;
  const activeUsers =
    users?.filter((user) => user.status === 'ACTIVE' || user.status === 'FULLY_VERIFIED').length ||
    0;
  const adminUsers = users?.filter((user) => user.role === 1).length || 0;

  const handleBulkSubmit = async (drafts: BulkUserDraft[]): Promise<BulkUploadResult> => {
    const result: BulkUploadResult = { successes: [], failures: [] };

    if (!drafts.length) {
      warning('No users detected in the uploaded file.');
      return result;
    }

    if (!userId) {
      const message = 'Active admin session is required to add users.';
      drafts.forEach((draft) => {
        result.failures.push({
          rowNumber: draft.rowNumber,
          identifier: draft.email || draft.username || `Row ${draft.rowNumber}`,
          message,
        });
      });
      notifyError('Unable to create users', message);
      return result;
    }

    for (const draft of drafts) {
      const identifier = draft.email || draft.username || `Row ${draft.rowNumber}`;

      try {
        if (!draft.username || !draft.email || !draft.phone_number) {
          throw new Error('Username, email, and phone number are required.');
        }

        const normalizedUsername = draft.username.replace(/\s+/g, '').trim();
        if (!normalizedUsername) {
          throw new Error('Username must contain at least one non-space character.');
        }

        const normalizedEmail = draft.email.trim();
        const normalizedPhone = draft.phone_number.trim();
        if (!normalizedEmail) {
          throw new Error('Email cannot be empty.');
        }
        if (!normalizedPhone) {
          throw new Error('Phone number cannot be empty.');
        }

        const payload: CreateUserDto = {
          username: normalizedUsername,
          email: normalizedEmail,
          phone_number: normalizedPhone,
          role: draft.role === 1 && canCreateAdmin() ? 1 : 3,
          status: draft.status || 'PENDING',
          password: draft.password ?? '',
          created_by: userId,
        };

        if (!payload.password || payload.password.length < 8) {
          const rand = Math.random().toString(36).slice(2, 8);
          payload.password = `A@${rand}1`;
        }

        const created = await addUser(payload);
        result.successes.push({
          rowNumber: draft.rowNumber,
          identifier: created.email || created.username || identifier,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create user.';
        result.failures.push({
          rowNumber: draft.rowNumber,
          identifier,
          message,
        });
      }
    }

    if (result.successes.length > 0) {
      notifySuccess(
        `Created ${result.successes.length} user${result.successes.length === 1 ? '' : 's'}`,
        result.failures.length
          ? `${result.failures.length} entr${result.failures.length === 1 ? 'y' : 'ies'} require attention.`
          : undefined,
      );
    }

    if (result.failures.length > 0) {
      notifyError(
        'Some users were not created',
        result.failures
          .slice(0, 3)
          .map(
            (failure: BulkUploadResult['failures'][number]) =>
              `${failure.identifier}: ${failure.message}`,
          )
          .join(' • ') || undefined,
      );
    }

    setBulkResult(result);
    await refreshUsers();
    return result;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
            <Users className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{totalUsers}</span>
            <span className="text-xs opacity-75">Total</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
            <UserCheck className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{activeUsers}</span>
            <span className="text-xs opacity-75">Active</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200">
            <Shield className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{adminUsers}</span>
            <span className="text-xs opacity-75">Admins</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openAddModal} className="rounded-full cursor-pointer" size={'sm'}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="rounded-full px-3 shadow-sm hover:shadow-md flex items-center cursor-pointer gap-2"
              title="Refresh users"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            {canCreateAdmin() && (
              <Button
                variant="default"
                size="sm"
                onClick={openBulkModal}
                className="rounded-full cursor-pointer gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="rounded-full px-3 shadow-sm hover:shadow-md cursor-pointer"
              title="Export users"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {users && users.length > 0 ? (
        <UserTableFiltered
          users={users}
          onEdit={openEditModal}
          onDelete={handleDeleteUser}
          onStatusChange={handleStatusChange}
          onAddViolation={handleAddViolation}
          onRemoveViolation={handleRemoveViolation}
          userStatusChanging={userStatusChanging}
          currentUserRole={userRole || undefined}
        />
      ) : (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-muted-foreground mb-2">No users yet</div>
          <div className="text-sm text-muted-foreground mb-4">
            Get started by adding your first user
          </div>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First User
          </Button>
        </div>
      )}

      <UserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={async (userData) => {
          if (!editingUser) {
            const createData = userData as CreateUserDto;
            if (createData.role === 1 && !canCreateAdmin()) {
              warning('You do not have permission to create admin users.');
              return;
            }
            try {
              const created = await addUser({ ...createData, created_by: userId || undefined });
              notifySuccess(
                'User created',
                `${created.email || created.username} added successfully.`,
              );
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to create user.';
              notifyError('Unable to create user', message);
              throw error;
            }
          } else {
            const updateData = userData as UpdateUserDto;

            if (!canManageUser(editingUser.role)) {
              warning('You do not have permission to edit admin users.');
              return;
            }

            if (updateData.role === 1 && !canCreateAdmin()) {
              warning('You do not have permission to assign admin role.');
              return;
            }
            try {
              const updated = await updateUser(editingUser.id, updateData);
              if (!updated) {
                throw new Error('No changes were saved.');
              }
              notifySuccess(
                'User updated',
                `${updated.email || updated.username} updated successfully.`,
              );
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to update user.';
              notifyError('Unable to update user', message);
              throw error;
            }
          }
        }}
        editingUser={editingUser}
      />

      <BulkUserUploadModal
        open={bulkModalOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setBulkResult(null);
          }
          setBulkModalOpen(open);
        }}
        onSubmit={handleBulkSubmit}
        result={bulkResult}
        canCreateAdmin={canCreateAdmin()}
        existingUsers={users ?? []}
      />
    </div>
  );
};

export default ManageStaff;
