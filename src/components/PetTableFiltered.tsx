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
import { ArrowDown, ArrowUp, ArrowUpDown, Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Pet } from '../config/types/pet';
import { HappinessImageDisplay } from './HappinessImageDisplay';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface PetTableProps {
  pets: Pet[];
  onEdit?: (pet: Pet) => void;
  onDelete?: (petId: number) => void;
}

export function PetTableFiltered({ pets, onEdit, onDelete }: PetTableProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<{
    column: 'age' | 'size' | 'weight' | null;
    order: 'asc' | 'desc';
  }>({ column: null, order: 'desc' });

  // Generate filter options based on available data
  const filterOptions = useMemo(() => {
    const typeOptions = [...new Set(pets.map((pet) => pet.type))].map((type) => ({
      label: type,
      value: type.toLowerCase(),
      count: pets.filter((pet) => pet.type === type).length,
    }));

    const breedOptions = [...new Set(pets.map((pet) => pet.breed).filter(Boolean))].map(
      (breed) => ({
        label: breed,
        value: breed.toLowerCase(),
        count: pets.filter((pet) => pet.breed === breed).length,
      }),
    );

    const sizeOptions = [...new Set(pets.map((pet) => pet.size))].map((size) => ({
      label: size.charAt(0).toUpperCase() + size.slice(1),
      value: size.toLowerCase(),
      count: pets.filter((pet) => pet.size === size).length,
    }));

    const statusOptions = [...new Set(pets.map((pet) => pet.request_status))]
      .filter(Boolean)
      .map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status.toLowerCase(),
        count: pets.filter((pet) => pet.request_status === status).length,
      }));

    const genderOptions = [...new Set(pets.map((pet) => pet.gender))].map((gender) => ({
      label: gender.charAt(0).toUpperCase() + gender.slice(1),
      value: gender.toLowerCase(),
      count: pets.filter((pet) => pet.gender === gender).length,
    }));

    return {
      typeOptions,
      breedOptions,
      sizeOptions,
      statusOptions,
      genderOptions,
    };
  }, [pets]);

  // Define filters
  const filters: TableFilter[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search pets by name, breed, or description...',
    },
    {
      id: 'type',
      label: 'Pet Type',
      type: 'multiselect',
      options: filterOptions.typeOptions,
      placeholder: 'Select pet types',
    },
    {
      id: 'breed',
      label: 'Breed/Pattern',
      type: 'multiselect',
      options: filterOptions.breedOptions,
      placeholder: 'Select breeds',
    },
    {
      id: 'gender',
      label: 'Gender',
      type: 'multiselect',
      options: filterOptions.genderOptions,
      placeholder: 'Select genders',
    },
    {
      id: 'size',
      label: 'Size',
      type: 'multiselect',
      options: filterOptions.sizeOptions,
      placeholder: 'Select sizes',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'multiselect',
      options: filterOptions.statusOptions,
      placeholder: 'Select status',
    },
    {
      id: 'vaccinated',
      label: 'Vaccinated Only',
      type: 'boolean',
      placeholder: 'Show only vaccinated pets',
    },
    {
      id: 'spayed',
      label: 'Spayed/Neutered Only',
      type: 'boolean',
      placeholder: 'Show only spayed/neutered pets',
    },
    {
      id: 'adopted',
      label: 'Adopted Only',
      type: 'boolean',
      placeholder: 'Show only adopted pets',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  // Apply filters
  const filteredPets = useMemo(() => {
    let filtered = pets.filter((pet) => {
      // Search filter
      if (filterValues.search) {
        const searchTerm = filterValues.search.toLowerCase();
        const searchableText = [
          pet.name,
          pet.breed,
          pet.description,
          pet.special_needs,
          pet.rescue_address,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Type filter
      if (filterValues.type && filterValues.type.length > 0) {
        if (!filterValues.type.includes(pet.type.toLowerCase())) {
          return false;
        }
      }

      // Breed filter
      if (filterValues.breed && filterValues.breed.length > 0) {
        if (!pet.breed || !filterValues.breed.includes(pet.breed.toLowerCase())) {
          return false;
        }
      }

      // Gender filter
      if (filterValues.gender && filterValues.gender.length > 0) {
        if (!filterValues.gender.includes(pet.gender.toLowerCase())) {
          return false;
        }
      }

      // Size filter
      if (filterValues.size && filterValues.size.length > 0) {
        if (!filterValues.size.includes(pet.size.toLowerCase())) {
          return false;
        }
      }

      // Status filter
      if (filterValues.status && filterValues.status.length > 0) {
        if (
          !pet.request_status ||
          !filterValues.status.includes(pet.request_status.toLowerCase())
        ) {
          return false;
        }
      }

      // Boolean filters
      if (filterValues.vaccinated && !pet.is_vaccinated) {
        return false;
      }

      if (filterValues.spayed && !pet.is_spayed_or_neutured) {
        return false;
      }

      if (filterValues.adopted && !pet.adopted) {
        return false;
      }

      return true;
    });

    // Apply sorting
    if (sortConfig.column) {
      filtered = [...filtered].sort((a, b) => {
        let compareA: number;
        let compareB: number;

        switch (sortConfig.column) {
          case 'weight':
            // Parse weight values, treating missing/invalid weights as 0
            compareA = parseFloat(a.weight?.replace(/[^0-9.]/g, '') || '0');
            compareB = parseFloat(b.weight?.replace(/[^0-9.]/g, '') || '0');
            break;
          case 'age':
            // Parse age values and convert to months for accurate comparison
            // "2 years" -> 24, "4 months" -> 4, "1 year" -> 12
            const parseAgeToMonths = (age: string | null | undefined): number => {
              if (!age) return 0;
              const ageLower = age.toLowerCase();
              const num = parseFloat(ageLower.replace(/[^0-9.]/g, '') || '0');

              if (ageLower.includes('year')) {
                return num * 12; // Convert years to months
              } else if (ageLower.includes('month')) {
                return num; // Already in months
              } else if (ageLower.includes('week')) {
                return num / 4; // Convert weeks to months (approximate)
              } else if (ageLower.includes('day')) {
                return num / 30; // Convert days to months (approximate)
              }
              return num * 12; // Default to years if no unit specified
            };

            compareA = parseAgeToMonths(a.age);
            compareB = parseAgeToMonths(b.age);
            break;
          case 'size':
            // Map size strings to numbers for comparison
            const sizeOrder = { small: 1, medium: 2, large: 3, 'extra large': 4 };
            compareA = sizeOrder[a.size?.toLowerCase() as keyof typeof sizeOrder] || 0;
            compareB = sizeOrder[b.size?.toLowerCase() as keyof typeof sizeOrder] || 0;
            break;
          default:
            return 0;
        }

        return sortConfig.order === 'asc' ? compareA - compareB : compareB - compareA;
      });
    }

    return filtered;
  }, [pets, filterValues, sortConfig]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'pending':
        return 'default'; // green
      case 'rejected':
        return 'destructive'; // red
      default:
        return 'outline'; // gray
    }
  };

  const toggleSort = (column: 'age' | 'size' | 'weight') => {
    if (sortConfig.column === column) {
      // Same column - cycle through: desc -> asc -> null
      if (sortConfig.order === 'desc') {
        setSortConfig({ column, order: 'asc' });
      } else {
        setSortConfig({ column: null, order: 'desc' });
      }
    } else {
      // New column - start with desc
      setSortConfig({ column, order: 'desc' });
    }
  };

  if (pets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🐾</div>
        <h3 className="text-lg font-semibold mb-2">No pets added yet</h3>
        <p className="text-muted-foreground">Add your first pet to get started!</p>
      </div>
    );
  }

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
          Showing {filteredPets.length} of {pets.length} pets
        </span>
      </div>

      {/* Table */}
      {filteredPets.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Breed/Pattern</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleSort('age')}
                          className="flex items-center gap-2 hover:text-foreground transition-colors"
                        >
                          Age
                          {sortConfig.column !== 'age' && <ArrowUpDown className="h-4 w-4" />}
                          {sortConfig.column === 'age' && sortConfig.order === 'asc' && (
                            <ArrowUp className="h-4 w-4" />
                          )}
                          {sortConfig.column === 'age' && sortConfig.order === 'desc' && (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {sortConfig.column !== 'age' && 'Click to sort by oldest'}
                          {sortConfig.column === 'age' &&
                            sortConfig.order === 'desc' &&
                            'Sorted by oldest - click for youngest'}
                          {sortConfig.column === 'age' &&
                            sortConfig.order === 'asc' &&
                            'Sorted by youngest - click to clear'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleSort('size')}
                          className="flex items-center gap-2 hover:text-foreground transition-colors"
                        >
                          Size
                          {sortConfig.column !== 'size' && <ArrowUpDown className="h-4 w-4" />}
                          {sortConfig.column === 'size' && sortConfig.order === 'asc' && (
                            <ArrowUp className="h-4 w-4" />
                          )}
                          {sortConfig.column === 'size' && sortConfig.order === 'desc' && (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {sortConfig.column !== 'size' && 'Click to sort by largest'}
                          {sortConfig.column === 'size' &&
                            sortConfig.order === 'desc' &&
                            'Sorted by largest - click for smallest'}
                          {sortConfig.column === 'size' &&
                            sortConfig.order === 'asc' &&
                            'Sorted by smallest - click to clear'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleSort('weight')}
                          className="flex items-center gap-2 hover:text-foreground transition-colors"
                        >
                          Weight
                          {sortConfig.column !== 'weight' && <ArrowUpDown className="h-4 w-4" />}
                          {sortConfig.column === 'weight' && sortConfig.order === 'asc' && (
                            <ArrowUp className="h-4 w-4" />
                          )}
                          {sortConfig.column === 'weight' && sortConfig.order === 'desc' && (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {sortConfig.column !== 'weight' && 'Click to sort by heaviest'}
                          {sortConfig.column === 'weight' &&
                            sortConfig.order === 'desc' &&
                            'Sorted by heaviest - click for lightest'}
                          {sortConfig.column === 'weight' &&
                            sortConfig.order === 'asc' &&
                            'Sorted by lightest - click to clear'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>Request Status</TableHead>
                <TableHead>Vaccination Status</TableHead>
                <TableHead>Spayed/Neutered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPets.map((pet, index) => {
                const odd = index % 2 === 1;
                return (
                  <TableRow key={pet.id} className={`${odd ? 'bg-gray-100' : ''}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                (pet.photos && pet.photos.length > 0 ? pet.photos[0] : null) || ''
                              }
                              alt={pet.name || 'Unnamed Pet'}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-muted">
                              {(pet.name || 'Unnamed Pet').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Show happiness image if pet is adopted and has one */}
                          {pet.adopted && pet.adopted.happiness_image && (
                            <div className="absolute -top-2 -right-2">
                              <HappinessImageDisplay
                                happinessImage={pet.adopted.happiness_image}
                                petName={pet.name || 'Unnamed Pet'}
                                size="sm"
                                showLabel={false}
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {pet.name && pet.name.length > 0 ? pet.name : 'Unnamed Pet'}
                          </div>
                          {pet.adopted && (
                            <div className="text-xs text-green-600 font-medium">
                              ✨ Adopted & Happy
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{pet.type}</TableCell>
                    <TableCell>{pet.breed}</TableCell>
                    <TableCell>{pet.gender}</TableCell>
                    <TableCell>{pet.age}</TableCell>
                    <TableCell>{pet.size}</TableCell>
                    <TableCell>{pet.weight ? `${pet.weight}` : 'Not specified'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(pet.request_status)}
                        className={`${getStatusColor(pet.request_status || '')}`}
                      >
                        {pet.request_status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>{pet.is_vaccinated ? 'Vaccinated' : 'Not Vaccinated'}</TableCell>
                    <TableCell>
                      {pet.is_spayed_or_neutured ? 'Spayed/Neutered' : 'Not Spayed/Neutered'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-[8px] items-center mr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                window.location.href = `/manage-pet/${pet.id}`;
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit?.(pet)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete?.(pet.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No pets match your filters</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or clearing some filters.
          </p>
          <Button variant="outline" onClick={() => setFilterValues({})}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
