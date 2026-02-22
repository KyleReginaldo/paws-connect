'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableFilter, TableFilters } from '@/components/ui/table-filters';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChatFilter } from './ChatFilterModal';

interface ChatFilterTableProps {
  filters: ChatFilter[];
  onEdit?: (filter: ChatFilter) => void;
  onDelete?: (filterId: string) => void;
  onToggleStatus?: (filterId: string, isActive: boolean) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  profanity: {
    label: 'Profanity',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  spam: {
    label: 'Spam',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  harassment: {
    label: 'Harassment',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  inappropriate: {
    label: 'Inappropriate',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
};

const SEVERITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Low', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  2: {
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  3: { label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export function ChatFilterTable({
  filters,
  onEdit,
  onDelete,
  onToggleStatus,
}: ChatFilterTableProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersPerPage] = useState(10);

  // Generate filter options based on available data
  const filterOptions = useMemo(() => {
    const categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, { label }]) => ({
      label,
      value,
      count: filters.filter((f) => f.category === value).length,
    }));

    const severityOptions = Object.entries(SEVERITY_LABELS).map(([value, { label }]) => ({
      label,
      value,
      count: filters.filter((f) => f.severity === parseInt(value)).length,
    }));

    const statusOptions = [
      { label: 'Active', value: 'active', count: filters.filter((f) => f.is_active).length },
      { label: 'Inactive', value: 'inactive', count: filters.filter((f) => !f.is_active).length },
    ];

    return { categoryOptions, severityOptions, statusOptions };
  }, [filters]);

  // Define filters
  const tableFilters: TableFilter[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by word or phrase...',
    },
    {
      id: 'category',
      label: 'Category',
      type: 'multiselect',
      options: filterOptions.categoryOptions,
      placeholder: 'Select categories',
    },
    {
      id: 'severity',
      label: 'Severity',
      type: 'multiselect',
      options: filterOptions.severityOptions,
      placeholder: 'Select severity levels',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'multiselect',
      options: filterOptions.statusOptions,
      placeholder: 'Select status',
    },
  ];

  // Apply filters
  const filteredFilters = useMemo(() => {
    let filtered = filters.filter((filter) => {
      // Search filter
      if (filterValues.search) {
        const searchTerm = filterValues.search.toLowerCase();
        if (!filter.word.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Category filter
      if (filterValues.category && filterValues.category.length > 0) {
        if (!filterValues.category.includes(filter.category)) {
          return false;
        }
      }

      // Severity filter
      if (filterValues.severity && filterValues.severity.length > 0) {
        if (!filterValues.severity.includes(filter.severity.toString())) {
          return false;
        }
      }

      // Status filter
      if (filterValues.status && filterValues.status.length > 0) {
        const isActive = filterValues.status.includes('active');
        const isInactive = filterValues.status.includes('inactive');
        if (isActive && !isInactive && !filter.is_active) return false;
        if (isInactive && !isActive && filter.is_active) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return filtered;
  }, [filters, filterValues, sortOrder]);

  // Pagination
  const indexOfLastFilter = currentPage * filtersPerPage;
  const indexOfFirstFilter = indexOfLastFilter - filtersPerPage;
  const currentFilters = filteredFilters.slice(indexOfFirstFilter, indexOfLastFilter);
  const totalPages = Math.ceil(filteredFilters.length / filtersPerPage);

  const toggleSort = () => {
    if (sortOrder === null) {
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      setSortOrder('asc');
    } else {
      setSortOrder(null);
    }
  };

  const getSortIcon = () => {
    if (sortOrder === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />;
    if (sortOrder === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />;
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      <TableFilters
        filters={tableFilters}
        onFiltersChange={setFilterValues}
        onClearAll={() => setFilterValues({})}
        className="w-full"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredFilters.length} of {filters.length} filters
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word/Phrase</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer" onClick={toggleSort}>
                <div className="flex items-center">Created {getSortIcon()}</div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentFilters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No filters found
                </TableCell>
              </TableRow>
            ) : (
              currentFilters.map((filter) => (
                <TableRow key={filter.id}>
                  <TableCell className="font-medium">{filter.word}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={CATEGORY_LABELS[filter.category]?.color || ''}
                    >
                      {CATEGORY_LABELS[filter.category]?.label || filter.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={SEVERITY_LABELS[filter.severity]?.color || ''}
                    >
                      {SEVERITY_LABELS[filter.severity]?.label || filter.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {filter.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {filter.created_at ? new Date(filter.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(filter)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onToggleStatus && (
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(filter.id, !filter.is_active)}
                          >
                            {filter.is_active ? (
                              <>
                                <ToggleLeft className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(filter.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => handlePageChange(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
