'use client';
import { User } from '@/config/models/users';
import { CreateUserDto, UpdateUserDto } from '@/config/schema/userChema';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface UsersContextType {
  users: User[] | null;
  status: 'loading' | 'success' | 'error';
  addUser: (userData: CreateUserDto) => Promise<User | null>;
  updateUser: (userId: string, userData: UpdateUserDto) => Promise<User | null>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUserStatus: (userId: string, status: string) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
}

interface UsersProviderProps {
  children: ReactNode;
}

export function UsersProvider({ children }: UsersProviderProps) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const fetchUsers = async () => {
    try {
      setStatus('loading');
      const response = await fetch('/api/v1/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      setUsers(result.data || []);
      setStatus('success');
    } catch (error) {
      console.error('Error fetching users:', error);
      setStatus('error');
      setUsers([]);
    }
  };

  const addUser = async (userData: CreateUserDto): Promise<User | null> => {
    try {
      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const result = await response.json();
      const newUser = result.data;

      setUsers((prevUsers) => {
        if (!prevUsers) return [newUser];
        // Put newest users on top
        return [newUser, ...prevUsers];
      });

      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      return null;
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserDto): Promise<User | null> => {
    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        throw new Error(errorData.message || 'Failed to update user');
      }

      const result = await response.json();
      const updatedUser = result.data;

      setUsers((prevUsers) => {
        if (!prevUsers) return null;
        return prevUsers.map((user) => (user.id === userId ? updatedUser : user));
      });

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers((prevUsers) => {
        if (!prevUsers) return null;
        return prevUsers.filter((user) => user.id !== userId);
      });

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const result = await response.json();
      const updatedUser = result.data;

      setUsers((prevUsers) => {
        if (!prevUsers) return null;
        return prevUsers.map((user) => (user.id === userId ? updatedUser : user));
      });

      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const value: UsersContextType = {
    users,
    status,
    addUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    refreshUsers,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}
