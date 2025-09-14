'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useUsers } from '@/app/context/UsersContext';
import { UserModal } from '@/components/UserModal';
import { UserTable } from '@/components/UserTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notification';
import { User } from '@/config/models/users';
import { CreateUserDto, UpdateUserDto } from '@/config/schema/userChema';
import { Download, Plus, Search, Shield, UserCheck, Users, X } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

const ManageStaff = () => {
  const { userId, userRole } = useAuth();
  const { users, addUser, updateUser, deleteUser, updateUserStatus } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const { warning } = useNotifications();

  // Permission helpers
  const canManageUser = (targetUserRole: number) => {
    // Admins (role 1) can manage everyone
    if (userRole === 1) return true;
    // Staff (role 2) cannot manage admins (role 1)
    if (userRole === 2 && targetUserRole === 1) return false;
    // Staff can manage other staff and regular users
    return userRole === 2;
  };

  const canCreateAdmin = () => {
    // Only admins can create other admins
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
    XLSX.writeFile(workbook, 'users.xlsx');
  };

  const handleDeleteUser = async (id: string) => {
    if (userId === id) {
      warning('You cannot delete your own account while logged in.');
      return;
    }

    // Find the user to check their role
    const userToDelete = users?.find((u) => u.id === id);
    if (!userToDelete) {
      warning('User not found.');
      return;
    }

    // Check if staff is trying to delete an admin
    if (!canManageUser(userToDelete.role)) {
      warning('You do not have permission to delete admin users.');
      return;
    }

    await deleteUser(id);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Find the user to check their role
    const userToUpdate = users?.find((u) => u.id === id);
    if (!userToUpdate) {
      warning('User not found.');
      return;
    }

    // Check if staff is trying to change status of an admin
    if (!canManageUser(userToUpdate.role)) {
      warning('You do not have permission to change admin user status.');
      return;
    }

    console.log('Updating user status:', id, newStatus);
    await updateUserStatus(id, newStatus);
  };

  // Filter users based on search query
  const filteredUsers =
    users?.filter((user) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        user.username?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone_number.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query)
      );
    }) || [];

  // Calculate stats
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((user) => user.status === 'ACTIVE').length || 0;
  const adminUsers = users?.filter((user) => user.role === 1).length || 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-2">User Management</h1>
        <p className="text-md text-muted-foreground">
          Manage all system users, staff members, and administrators. Control access, roles, and
          user status.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, phone, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="rounded-full px-3 shadow-sm hover:shadow-md"
              title="Export users"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            {/* Import removed — users are created via admin flows. */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeUsers}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{adminUsers}</div>
              <div className="text-sm text-muted-foreground">Administrators</div>
            </div>
          </div>
        </div>
      </div>

      {users && filteredUsers.length > 0 && (
        <>
          <UserTable
            users={filteredUsers.slice((page - 1) * pageSize, page * pageSize)}
            onEdit={openEditModal}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
          />

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                disabled={page * pageSize >= filteredUsers.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Go to top
              </Button>
            </div>
          </div>
        </>
      )}

      {users && filteredUsers.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-lg font-medium text-muted-foreground mb-2">
            No users found matching &quot;{searchQuery}&quot;
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            Try searching by a different name, email, phone, or status
          </div>
          <Button onClick={() => setSearchQuery('')} variant="outline">
            Clear Search
          </Button>
        </div>
      )}

      {users && users.length === 0 && !searchQuery && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
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
            // Adding a new user - check if staff is trying to create admin
            const createData = userData as CreateUserDto;
            if (createData.role === 1 && !canCreateAdmin()) {
              warning('You do not have permission to create admin users.');
              return;
            }

            const newUser = await addUser(createData);
            if (newUser) {
              console.log('User added successfully:', newUser);
            }
          } else {
            // Updating existing user - check permissions
            const updateData = userData as UpdateUserDto;

            // Check if staff is trying to update an admin
            if (!canManageUser(editingUser.role)) {
              warning('You do not have permission to edit admin users.');
              return;
            }

            // Check if staff is trying to change someone's role to admin
            if (updateData.role === 1 && !canCreateAdmin()) {
              warning('You do not have permission to assign admin role.');
              return;
            }

            console.log(`Editing user: ${editingUser.id}`);
            const updatedUser = await updateUser(editingUser.id, updateData);
            if (updatedUser) {
              console.log('User updated successfully:', updatedUser);
            }
          }
        }}
        editingUser={editingUser}
      />
    </div>
  );
};

export default ManageStaff;
