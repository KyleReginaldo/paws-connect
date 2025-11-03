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
import { TableFilter, TableFilters } from '@/components/ui/table-filters';
import { transformUrlForLocalhost } from '@/lib/url-utils';
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
import { useMemo, useState } from 'react';
import type { User } from '../config/models/users';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { ScrollArea } from './ui/scroll-area';
import { UserDetailsSheet } from './UserDetailsSheet';

interface UserTableFilteredProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  onStatusChange?: (userId: string, status: string) => void;
  onAddViolation?: (userId: string, violation: string) => void;
  onRemoveViolation?: (userId: string, violationIndex: number) => void;
  userStatusChanging?: string | null;
  currentUserRole?: number;
}

export function UserTableFiltered({
  users,
  onEdit,
  onDelete,
  onStatusChange,
  userStatusChanging,
  onAddViolation,
  onRemoveViolation,
  currentUserRole,
}: UserTableFilteredProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Generate filter options based on available data
  const filterOptions = useMemo(() => {
    const roleOptions = [
      { label: 'Admin', value: '1', count: users.filter((user) => user.role === 1).length },
      { label: 'User', value: '3', count: users.filter((user) => user.role === 3).length },
    ];

    const statusOptions = [...new Set(users.map((user) => user.status))].map((status) => ({
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: status.toLowerCase(),
      count: users.filter((user) => user.status === status).length,
    }));

    return { roleOptions, statusOptions };
  }, [users]);

  // Define filters
  const filters: TableFilter[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search users by name, email, or phone...',
    },
    {
      id: 'role',
      label: 'Role',
      type: 'multiselect',
      options: filterOptions.roleOptions,
      placeholder: 'Select roles',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'multiselect',
      options: filterOptions.statusOptions,
      placeholder: 'Select statuses',
    },
    {
      id: 'hasViolations',
      label: 'Has Violations',
      type: 'boolean',
      placeholder: 'Show only users with violations',
    },
    {
      id: 'joinedDate',
      label: 'Joined Date',
      type: 'daterange',
      placeholder: 'Select date range',
    },
  ];

  // Apply filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      if (filterValues.search) {
        const searchTerm = filterValues.search.toLowerCase();
        const searchableText = [user.username, user.email, user.phone_number]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Role filter
      if (filterValues.role && filterValues.role.length > 0) {
        if (!filterValues.role.includes(user.role.toString())) {
          return false;
        }
      }

      // Status filter
      if (filterValues.status && filterValues.status.length > 0) {
        if (!filterValues.status.includes(user.status.toLowerCase())) {
          return false;
        }
      }

      // Has violations filter
      if (filterValues.hasViolations) {
        if (!user.violations || user.violations.length === 0) {
          return false;
        }
      }

      // Joined date filter
      if (filterValues.joinedDate?.from) {
        const userDate = new Date(user.created_at);
        const fromDate = filterValues.joinedDate.from;
        const toDate = filterValues.joinedDate.to || new Date();

        if (userDate < fromDate || userDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [users, filterValues]);

  // Pagination logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No users added yet</h3>
        <p className="text-muted-foreground">Add your first user to get started!</p>
      </div>
    );
  }

  // Permission helper - Only admins can manage users
  const canManageUser = () => {
    // Only admins (role 1) can manage users
    return currentUserRole === 1;
  };

  const getRoleText = (role: number) => {
    switch (role) {
      case 1:
        return 'Admin';
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
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'fully_verified':
        return 'Fully Verified';
      case 'semi_verified':
        return 'Semi Verified';
      case 'inactive':
        return 'Inactive';
      case 'banned':
      case 'indefinite':
        return 'Indefinite';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
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
    <div className="space-y-4">
      <TableFilters
        filters={filters}
        onFiltersChange={setFilterValues}
        onClearAll={() => setFilterValues({})}
        className="w-full"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredUsers.length} of {users.length} users
        </span>
      </div>

      {/* Table */}
      {filteredUsers.length > 0 ? (
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            transformUrlForLocalhost(user.profile_image_link) ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${user.username || 'Unknown'}`
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
                    {userStatusChanging === user.id ? (
                      <Badge className={`font-medium animate-pulse ${getStatusColor(user.status)}`}>
                        Updating...
                      </Badge>
                    ) : (
                      <Badge className={getStatusColor(user.status)}>
                        {getStatusText(user.status)}
                      </Badge>
                    )}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
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
                                          <span className="font-medium">#{index + 1}:</span>{' '}
                                          {violation}
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
                  <TableCell className="text-right">
                    {user.role !== 1 ? (
                      <>
                        {userStatusChanging === user.id ? (
                          <div className="flex items-center justify-end gap-[2] mr-[10px]">
                            <span className="h-[2.5px] w-[2.5px] rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-[2.5px] w-[2.5px] rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="h-[2.5px] w-[2.5px] rounded-full bg-orange-500 animate-bounce"></span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setSelectedUser(user);
                                    requestAnimationFrame(() => setDetailsOpen(true));
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" /> View details
                                </DropdownMenuItem>
                                {canManageUser() && (
                                  <DropdownMenuItem onClick={() => onEdit?.(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canManageUser() && user.status !== 'FULLY_VERIFIED' && (
                                  <DropdownMenuItem
                                    onClick={() => onStatusChange?.(user.id, 'FULLY_VERIFIED')}
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Fully Verify
                                  </DropdownMenuItem>
                                )}
                                {canManageUser() &&
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
                                {canManageUser() && user.status !== 'INDEFINITE' && (
                                  <DropdownMenuItem
                                    onClick={() => onStatusChange?.(user.id, 'INDEFINITE')}
                                  >
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
                                {canManageUser() &&
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
                          </div>
                        )}
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No users match your filters</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or clearing some filters.
          </p>
          <Button variant="outline" onClick={() => setFilterValues({})}>
            Clear all filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, totalUsers)} of {totalUsers} users
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={
                    currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {selectedUser && (
        <UserDetailsSheet
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          user={selectedUser}
          currentUserRole={currentUserRole}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onAddViolation={onAddViolation}
          onRemoveViolation={onRemoveViolation}
        />
      )}
    </div>
  );
}
