'use client';

import { HappinessImageDisplay } from '@/components/HappinessImageDisplay';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// removed Card wrapper around the table
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton-patterns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Cat,
  Check,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
  ClockFading,
  Dog,
  Eye,
  Loader2,
  LucideProps,
  PawPrint,
  SearchIcon,
  X,
} from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes, useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
interface Adoption {
  id: number;
  user: string | null;
  pet: number | null;
  created_at: string;
  happiness_image: string | null;
  has_children_in_home: boolean | null;
  has_other_pets_in_home: boolean | null;
  have_outdoor_space: boolean | null;
  have_permission_from_landlord: boolean | null;
  is_renting: boolean | null;
  number_of_household_members: number | null;
  type_of_residence: string | null;
  status: string;
  // New fields for adoption form
  reason_for_adopting?: string | null;
  willing_to_visit_shelter?: boolean | null;
  willing_to_visit_again?: boolean | null;
  adopting_for_self?: boolean | null;
  how_can_you_give_fur_rever_home?: string | null;
  where_did_you_hear_about_us?: string | null;
  // Supabase joins will add these directly
  pets?: Pet;
  users?: User;
}

interface Pet {
  id: number;
  name: string;
  type: string;
  breed: string | null;
  photos: string[] | null;
  request_status: string | null;
}

interface User {
  id: string;
  username: string | null;
  email: string | null;
  phone_number: string;
  user_identification?: {
    first_name: string | null;
    last_name: string | null;
    middle_initial: string | null;
    address: string | null;
  } | null;
}

interface AdoptionWithDetails extends Adoption {
  pet_details?: Pet;
  user_details?: User;
}
const toIcon = (
  status: string,
): ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>> => {
  switch (status) {
    case 'APPROVED':
      return Check;
    case 'REJECTED':
    case 'CANCELLED':
      return X;
    case 'PENDING':
      return ClockFading;
    default:
      return PawPrint;
  }
};

const AdoptionsPage = () => {
  const [adoptions, setAdoptions] = useState<AdoptionWithDetails[]>([]);
  const [filteredAdoptions, setFilteredAdoptions] = useState<AdoptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [petTypeFilter, setPetTypeFilter] = useState('all');
  const [approving, setApproving] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const router = useRouter();
  const fetchAdoptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch adoptions with joined pets and users data
      const adoptionsResponse = await fetch('/api/v1/adoption');

      if (!adoptionsResponse.ok) throw new Error('Failed to fetch adoptions');

      const adoptionsData = await adoptionsResponse.json();

      const adoptionsWithDetails: AdoptionWithDetails[] = (adoptionsData.data || []).map(
        (adoption: Adoption) => {
          return {
            ...adoption,
            pet_details: adoption.pets || undefined,
            user_details: adoption.users || undefined,
          };
        },
      );

      setAdoptions(adoptionsWithDetails);
      setFilteredAdoptions(adoptionsWithDetails);
    } catch (err) {
      console.error('Error fetching adoptions:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdoptions();
  }, [fetchAdoptions]);

  // Filter adoptions based on search term and filters
  useEffect(() => {
    let filtered = adoptions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((adoption) => {
        const petName = adoption.pet_details?.name?.toLowerCase() || '';
        const petBreed = adoption.pet_details?.breed?.toLowerCase() || '';
        const userName = adoption.user_details?.username?.toLowerCase() || '';
        const userEmail = adoption.user_details?.email?.toLowerCase() || '';
        const firstName =
          adoption.user_details?.user_identification?.first_name?.toLowerCase() || '';
        const lastName = adoption.user_details?.user_identification?.last_name?.toLowerCase() || '';
        const address = adoption.user_details?.user_identification?.address?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();

        return (
          petName.includes(search) ||
          petBreed.includes(search) ||
          userName.includes(search) ||
          userEmail.includes(search) ||
          firstName.includes(search) ||
          lastName.includes(search) ||
          address.includes(search)
        );
      });
    }

    // Status filter (match by explicit status field)
    if (statusFilter !== 'all') {
      const desired = statusFilter.toUpperCase();
      filtered = filtered.filter((adoption) => adoption.status?.toUpperCase() === desired);
    }

    // Pet type filter
    if (petTypeFilter !== 'all') {
      filtered = filtered.filter((adoption) => {
        const petType = adoption.pet_details?.type?.toLowerCase() || '';
        return petType.includes(petTypeFilter.toLowerCase());
      });
    }

    // Apply sorting by application date
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    setFilteredAdoptions(filtered);
  }, [adoptions, searchTerm, statusFilter, petTypeFilter, sortOrder]);

  const toggleSort = () => {
    if (sortOrder === null) {
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      setSortOrder('asc');
    } else {
      setSortOrder(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  const approveAdoption = async (adoptionId: number) => {
    try {
      setApproving(adoptionId);
      const response = await fetch(`/api/v1/adoption/${adoptionId}/approve`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to approve adoption');
      console.log('response', response);

      fetchAdoptions().then(() => {
        setApproving(null);
      });
    } catch (err) {
      console.error('Error approving adoption:', err);
      alert(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900">Failed to load adoptions</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={fetchAdoptions} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-md"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <CircleDot /> All Status
            </SelectItem>
            <SelectItem value="pending" className="text-orange-400">
              <CircleDashed color="orange" /> Pending
            </SelectItem>
            <SelectItem value="approved" className="text-green-500">
              <CircleCheck color="green" />
              Approved
            </SelectItem>
            <SelectItem value="rejected" className="text-red-500">
              {' '}
              <CircleX color="red" />
              Rejected
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={petTypeFilter} onValueChange={setPetTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Pet Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <PawPrint />
              All Types
            </SelectItem>
            <SelectItem value="dog" className="text-[#8B5A2B]">
              <Dog className="text-[#8B5A2B]" />
              Dogs
            </SelectItem>
            <SelectItem value="cat" className="text-[#F5A623]">
              <Cat className="text-[#F5A623]" />
              Cats
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="destructive"
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setPetTypeFilter('all');
          }}
        >
          Clear
        </Button>
      </div>

      {/* Adoptions Table */}
      <div>
        <div className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Applications ({filteredAdoptions.length})</h2>
              <p className="text-sm text-muted-foreground">
                Track and manage all adoption applications
              </p>
            </div>
          </div>
        </div>
        {filteredAdoptions.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Pet</TableHead>
                  <TableHead className="w-[200px]">Adopter</TableHead>
                  <TableHead>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={toggleSort}
                            className="flex items-center gap-2 hover:text-foreground transition-colors"
                          >
                            Application Date
                            {sortOrder === null && <ArrowUpDown className="h-4 w-4" />}
                            {sortOrder === 'asc' && <ArrowUp className="h-4 w-4" />}
                            {sortOrder === 'desc' && <ArrowDown className="h-4 w-4" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {sortOrder === null && 'Click to sort by newest'}
                            {sortOrder === 'desc' && 'Sorted by newest - click for oldest'}
                            {sortOrder === 'asc' && 'Sorted by oldest - click to clear'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Household</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdoptions.map((adoption) => {
                  const StatusIcon = toIcon(adoption.status);
                  return (
                    <TableRow key={adoption.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={
                                  (adoption.pet_details?.photos &&
                                  adoption.pet_details.photos.length > 0
                                    ? adoption.pet_details.photos[0]
                                    : null) || ''
                                }
                                alt={adoption.pet_details?.name || 'Pet'}
                              />
                              <AvatarFallback className="bg-orange-50 text-orange-600">
                                <PawPrint className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            {/* Show happiness image if adoption is approved and has one */}
                            {adoption.status === 'APPROVED' && adoption.happiness_image && (
                              <div className="absolute -top-2 -right-2">
                                <HappinessImageDisplay
                                  happinessImage={adoption.happiness_image}
                                  petName={adoption.pet_details?.name || 'Pet'}
                                  size="sm"
                                  showLabel={false}
                                />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {adoption.pet_details?.name || 'Unknown Pet'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {adoption.pet_details?.breed ||
                                adoption.pet_details?.type ||
                                'Unknown Type'}
                            </p>
                            {adoption.status === 'APPROVED' && adoption.happiness_image && (
                              <p className="text-xs text-green-600 font-medium">✨ Happy & Loved</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium text-sm truncate">
                            {adoption.user_details?.user_identification?.first_name &&
                            adoption.user_details?.user_identification?.last_name
                              ? `${adoption.user_details.user_identification.first_name} ${adoption.user_details.user_identification.middle_initial ? adoption.user_details.user_identification.middle_initial + ' ' : ''}${adoption.user_details.user_identification.last_name}`
                              : adoption.user_details?.username || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            Username: {adoption.user_details?.username || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {adoption.user_details?.email || 'No email'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            📍 {adoption.user_details?.user_identification?.address || 'No address'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(adoption.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(adoption.created_at)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            adoption.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800 border-green-300 font-medium hover:bg-green-200 transition-colors'
                              : adoption.status === 'REJECTED' || adoption.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800 border-red-300 font-medium hover:bg-red-200 transition-colors'
                                : adoption.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 font-medium hover:bg-yellow-200 transition-colors'
                                  : 'bg-gray-100 text-gray-800 border-gray-300 font-medium hover:bg-gray-200 transition-colors'
                          }
                        >
                          <StatusIcon className="ml-1 h-4 w-4" />
                          {adoption.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {adoption.user_details?.phone_number || 'No phone'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{adoption.type_of_residence || 'Not specified'}</p>
                          <p className="text-xs text-gray-500">
                            {adoption.number_of_household_members || 0} members
                          </p>
                          {adoption.has_children_in_home && (
                            <Badge variant="outline" className="text-xs">
                              Has children
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs cursor-pointer bg-gray-800 text-white hover:bg-orange-400 hover:text-white"
                            onClick={() => {
                              router.push(`/adoptions/${adoption.id}`);
                            }}
                          >
                            <Eye />
                            View Details
                          </Button>
                          {adoption.status === 'PENDING' && (
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-xs cursor-pointer text-white"
                              onClick={() => approveAdoption(adoption.id)}
                            >
                              {approving === adoption.id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <PawPrint className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No adoption applications found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || petTypeFilter !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'Applications will appear here once users start applying for pets'}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPetTypeFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdoptionsPage;
