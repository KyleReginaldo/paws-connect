'use client';

import { useUsers } from '@/app/context/UsersContext';
import { UserModal } from '@/components/UserModal';
import { UserTable } from '@/components/UserTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/config/models/users';
import { Plus, Search, Shield, UserCheck, Users, X } from 'lucide-react';
import { useState } from 'react';

const ManageStaff = () => {
  const { users, addUser, updateUser, deleteUser, updateUserStatus } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    console.log('Deleting user with id:', id);
    await deleteUser(id);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    console.log('Updating user status:', id, newStatus);
    await updateUserStatus(id, newStatus);
  };

  // Filter users based on search query
  const filteredUsers =
    users?.filter((user) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        user.username.toLowerCase().includes(query) ||
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
        <h1 className="text-4xl font-bold mb-2">User Management</h1>
        <p className="text-lg text-muted-foreground">
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
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
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
        <UserTable
          users={filteredUsers}
          onEdit={openEditModal}
          onDelete={handleDeleteUser}
          onStatusChange={handleStatusChange}
        />
      )}

      {users && filteredUsers.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-lg font-medium text-muted-foreground mb-2">
            No users found matching "{searchQuery}"
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
            // Adding a new user
            const newUser = await addUser(userData);
            if (newUser) {
              console.log('User added successfully:', newUser);
            }
          } else {
            // Updating existing user
            console.log(`Editing user: ${editingUser.id}`);
            const updatedUser = await updateUser(editingUser.id, userData);
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
