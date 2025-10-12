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
import { useMemo, useState } from 'react';

interface Donation {
  id: number;
  title: string;
  description: string;
  donated: number;
  target: number;
  createdBy: string;
  createdAt: string;
  targetDate: string;
}

const donations: Donation[] = [
  {
    id: 1,
    title: 'Food Assistance',
    description: 'Pambili ng bigas at de lata para sa mga stray feeders.',
    donated: 7500,
    target: 15000,
    createdBy: 'Alhone Cruz',
    createdAt: 'May 5, 2025',
    targetDate: 'June 30, 2025',
  },
  {
    id: 2,
    title: 'Medical Fund for Luna',
    description: 'Surgery and medication for a rescued dog named Luna.',
    donated: 12000,
    target: 25000,
    createdBy: 'Maria Dela Cruz',
    createdAt: 'May 10, 2025',
    targetDate: 'July 10, 2025',
  },
  {
    id: 3,
    title: 'Shelter Roof Repair',
    description: 'Repair damaged roof before rainy season hits.',
    donated: 18000,
    target: 30000,
    createdBy: 'Kyle Reginaldo',
    createdAt: 'May 15, 2025',
    targetDate: 'July 1, 2025',
  },
  {
    id: 4,
    title: 'Vaccine Drive',
    description: 'Free vaccination for stray dogs and cats in Cavite.',
    donated: 5000,
    target: 20000,
    createdBy: 'Jen Santos',
    createdAt: 'May 20, 2025',
    targetDate: 'August 5, 2025',
  },
  {
    id: 5,
    title: 'Rescue Van Maintenance',
    description: 'Oil change and tire replacement for rescue vehicle.',
    donated: 3500,
    target: 10000,
    createdBy: 'Mark Javier',
    createdAt: 'May 25, 2025',
    targetDate: 'July 20, 2025',
  },
  {
    id: 6,
    title: 'Adoption Kit Supplies',
    description: 'Collars, leashes, and starter food for adopted pets.',
    donated: 8000,
    target: 12000,
    createdBy: 'Liza Gonzales',
    createdAt: 'May 28, 2025',
    targetDate: 'July 15, 2025',
  },
];

export function DashboardDonationTableFiltered() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  // Generate filter options based on available data
  const filterOptions = useMemo(() => {
    const creatorOptions = [...new Set(donations.map((donation) => donation.createdBy))].map(
      (creator) => ({
        label: creator,
        value: creator.toLowerCase(),
        count: donations.filter((donation) => donation.createdBy === creator).length,
      }),
    );

    const progressOptions = [
      {
        label: 'Not Started (0%)',
        value: 'not-started',
        count: donations.filter((d) => d.donated === 0).length,
      },
      {
        label: 'In Progress (1-99%)',
        value: 'in-progress',
        count: donations.filter((d) => d.donated > 0 && d.donated / d.target < 1).length,
      },
      {
        label: 'Completed (100%+)',
        value: 'completed',
        count: donations.filter((d) => d.donated >= d.target).length,
      },
    ];

    const amountRanges = [
      {
        label: 'Under ₱10,000',
        value: 'under-10k',
        count: donations.filter((d) => d.target < 10000).length,
      },
      {
        label: '₱10,000 - ₱20,000',
        value: '10k-20k',
        count: donations.filter((d) => d.target >= 10000 && d.target <= 20000).length,
      },
      {
        label: 'Over ₱20,000',
        value: 'over-20k',
        count: donations.filter((d) => d.target > 20000).length,
      },
    ];

    return { creatorOptions, progressOptions, amountRanges };
  }, []);

  // Define filters
  const filters: TableFilter[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search donations by title or description...',
    },
    {
      id: 'creator',
      label: 'Created By',
      type: 'multiselect',
      options: filterOptions.creatorOptions,
      placeholder: 'Select creators',
    },
    {
      id: 'progress',
      label: 'Progress',
      type: 'multiselect',
      options: filterOptions.progressOptions,
      placeholder: 'Select progress status',
    },
    {
      id: 'targetAmount',
      label: 'Target Amount',
      type: 'multiselect',
      options: filterOptions.amountRanges,
      placeholder: 'Select amount ranges',
    },
    {
      id: 'urgent',
      label: 'Urgent (Target date within 30 days)',
      type: 'boolean',
      placeholder: 'Show only urgent donations',
    },
  ];

  // Helper function to parse date strings like "May 5, 2025"
  const parseDate = (dateStr: string): Date => {
    return new Date(dateStr);
  };

  // Apply filters
  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      // Search filter
      if (filterValues.search) {
        const searchTerm = filterValues.search.toLowerCase();
        const searchableText = [donation.title, donation.description, donation.createdBy]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Creator filter
      if (filterValues.creator && filterValues.creator.length > 0) {
        if (!filterValues.creator.includes(donation.createdBy.toLowerCase())) {
          return false;
        }
      }

      // Progress filter
      if (filterValues.progress && filterValues.progress.length > 0) {
        const progressPercent = donation.donated / donation.target;
        const progressCategory =
          donation.donated === 0
            ? 'not-started'
            : progressPercent >= 1
              ? 'completed'
              : 'in-progress';

        if (!filterValues.progress.includes(progressCategory)) {
          return false;
        }
      }

      // Target amount filter
      if (filterValues.targetAmount && filterValues.targetAmount.length > 0) {
        const amountCategory =
          donation.target < 10000 ? 'under-10k' : donation.target <= 20000 ? '10k-20k' : 'over-20k';

        if (!filterValues.targetAmount.includes(amountCategory)) {
          return false;
        }
      }

      // Urgent filter (target date within 30 days)
      if (filterValues.urgent) {
        const targetDate = parseDate(donation.targetDate);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        if (targetDate > thirtyDaysFromNow) {
          return false;
        }
      }

      return true;
    });
  }, [filterValues]);

  const getProgressPercentage = (donated: number, target: number) => {
    return Math.min(Math.round((donated / target) * 100), 100);
  };

  const getProgressBadgeVariant = (percentage: number) => {
    if (percentage === 0) return 'outline';
    if (percentage >= 100) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <TableFilters
        filters={filters}
        onFiltersChange={setFilterValues}
        onClearAll={() => setFilterValues({})}
        className="w-full"
      />

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredDonations.length} of {donations.length} donations
        </span>
        <span>
          Total raised: ₱{filteredDonations.reduce((sum, d) => sum + d.donated, 0).toLocaleString()}
        </span>
      </div>

      {/* Table */}
      {filteredDonations.length > 0 ? (
        <Table className="bg-white">
          <TableHeader>
            <TableRow className="bg-[#fe5c2647]">
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Donated</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead>Created at</TableHead>
              <TableHead>Target date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDonations.map((donation, index) => {
              const even = index % 2 === 0;
              const progressPercentage = getProgressPercentage(donation.donated, donation.target);
              const isUrgent =
                parseDate(donation.targetDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <TableRow
                  key={donation.id}
                  className={`${even ? 'bg-gray-50' : ''} ${isUrgent ? 'border-l-4 border-l-orange-400' : ''}`}
                >
                  <TableCell className="font-medium">{donation.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {donation.title}
                      {isUrgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={donation.description}>
                      {donation.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progressPercentage >= 100
                              ? 'bg-green-500'
                              : progressPercentage >= 50
                                ? 'bg-blue-500'
                                : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                      <Badge
                        variant={getProgressBadgeVariant(progressPercentage)}
                        className="text-xs"
                      >
                        {progressPercentage}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    ₱{donation.donated.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">₱{donation.target.toLocaleString()}</TableCell>
                  <TableCell>{donation.createdBy}</TableCell>
                  <TableCell>{donation.createdAt}</TableCell>
                  <TableCell>
                    <div className={isUrgent ? 'font-medium text-orange-600' : ''}>
                      {donation.targetDate}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No donations match your filters</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or clearing some filters.
          </p>
          <button
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
            onClick={() => setFilterValues({})}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
