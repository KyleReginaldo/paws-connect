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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Dog,
  Edit,
  Eye,
  MoreHorizontal,
  Stethoscope,
  Trash2,
} from 'lucide-react';
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
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<{
    column: 'age' | 'size' | 'weight' | null;
    order: 'asc' | 'desc';
  }>({ column: null, order: 'desc' });

  const filterOptions = useMemo(() => {
    // Helper function to get base filtered pets (excluding the current filter category)
    const getBaseFilteredPets = (excludeFilterKey: string) => {
      return pets.filter((pet) => {
        if (excludeFilterKey !== 'search' && filterValues.search) {
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
          if (!searchableText.includes(searchTerm)) return false;
        }

        if (excludeFilterKey !== 'type' && filterValues.type?.length > 0) {
          if (!filterValues.type.includes(pet.type.toLowerCase())) return false;
        }

        if (excludeFilterKey !== 'breed' && filterValues.breed?.length > 0) {
          if (!pet.breed || !filterValues.breed.includes(pet.breed.toLowerCase())) return false;
        }

        if (excludeFilterKey !== 'gender' && filterValues.gender?.length > 0) {
          if (!filterValues.gender.includes(pet.gender.toLowerCase())) return false;
        }

        if (excludeFilterKey !== 'size' && filterValues.size?.length > 0) {
          if (!filterValues.size.includes(pet.size.toLowerCase())) return false;
        }

        if (excludeFilterKey !== 'status' && filterValues.status?.length > 0) {
          if (
            !pet.request_status ||
            !filterValues.status.includes(pet.request_status.toLowerCase())
          )
            return false;
        }

        if (excludeFilterKey !== 'vaccinated' && filterValues.vaccinated && !pet.is_vaccinated) {
          return false;
        }

        if (excludeFilterKey !== 'spayed' && filterValues.spayed && !pet.is_spayed_or_neutured) {
          return false;
        }

        if (excludeFilterKey !== 'adopted' && filterValues.adopted && !pet.adopted) {
          return false;
        }

        return true;
      });
    };

    const basePetsForType = getBaseFilteredPets('type');
    const typeOptions = [...new Set(pets.map((pet) => pet.type))].map((type) => ({
      label: type,
      value: type.toLowerCase(),
      count: basePetsForType.filter((pet) => pet.type === type).length,
    }));

    const basePetsForBreed = getBaseFilteredPets('breed');
    const breedOptions = [...new Set(pets.map((pet) => pet.breed).filter(Boolean))].map(
      (breed) => ({
        label: breed,
        value: breed.toLowerCase(),
        count: basePetsForBreed.filter((pet) => pet.breed === breed).length,
      }),
    );

    const basePetsForSize = getBaseFilteredPets('size');
    const sizeOptions = [...new Set(pets.map((pet) => pet.size))].map((size) => ({
      label: size.charAt(0).toUpperCase() + size.slice(1),
      value: size.toLowerCase(),
      count: basePetsForSize.filter((pet) => pet.size === size).length,
    }));

    const basePetsForStatus = getBaseFilteredPets('status');
    const statusOptions = [...new Set(pets.map((pet) => pet.request_status))]
      .filter(Boolean)
      .map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status.toLowerCase(),
        count: basePetsForStatus.filter((pet) => pet.request_status === status).length,
      }));

    const basePetsForGender = getBaseFilteredPets('gender');
    const genderOptions = [...new Set(pets.map((pet) => pet.gender))].map((gender) => ({
      label: gender.charAt(0).toUpperCase() + gender.slice(1),
      value: gender.toLowerCase(),
      count: basePetsForGender.filter((pet) => pet.gender === gender).length,
    }));

    return {
      typeOptions,
      breedOptions,
      sizeOptions,
      statusOptions,
      genderOptions,
    };
  }, [pets, filterValues]);

  // Basic search and general filters
  const basicFilters: TableFilter[] = [
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
  ];

  // Health-related filters
  const healthFilters: TableFilter[] = [
    {
      id: 'vaccinated',
      label: 'Vaccinated',
      type: 'boolean',
      placeholder: 'Show only vaccinated pets',
    },
    {
      id: 'spayed',
      label: 'Spayed/Neutered',
      type: 'boolean',
      placeholder: 'Show only spayed/neutered pets',
    },
  ];

  // Adoption status filter
  const adoptionFilters: TableFilter[] = [
    {
      id: 'adopted',
      label: 'Adopted',
      type: 'boolean',
      placeholder: 'Show only adopted pets',
    },
  ];

  const getStatusColor = (adopted: boolean) => {
    if (adopted) {
      return 'bg-green-100 text-green-500 border-green-500';
    } else {
      return 'bg-blue-100 text-blue-500 border-blue-500';
    }
  };

  const filteredPets = useMemo(() => {
    let filtered = pets.filter((pet) => {
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

      if (filterValues.type && filterValues.type.length > 0) {
        if (!filterValues.type.includes(pet.type.toLowerCase())) {
          return false;
        }
      }

      if (filterValues.breed && filterValues.breed.length > 0) {
        if (!pet.breed || !filterValues.breed.includes(pet.breed.toLowerCase())) {
          return false;
        }
      }

      if (filterValues.gender && filterValues.gender.length > 0) {
        if (!filterValues.gender.includes(pet.gender.toLowerCase())) {
          return false;
        }
      }

      if (filterValues.size && filterValues.size.length > 0) {
        if (!filterValues.size.includes(pet.size.toLowerCase())) {
          return false;
        }
      }

      if (filterValues.status && filterValues.status.length > 0) {
        if (
          !pet.request_status ||
          !filterValues.status.includes(pet.request_status.toLowerCase())
        ) {
          return false;
        }
      }

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

    if (sortConfig.column) {
      filtered = [...filtered].sort((a, b) => {
        let compareA: number;
        let compareB: number;

        switch (sortConfig.column) {
          case 'weight':
            compareA = parseFloat(a.weight?.replace(/[^0-9.]/g, '') || '0');
            compareB = parseFloat(b.weight?.replace(/[^0-9.]/g, '') || '0');
            break;
          case 'age':
            const parseAgeToMonths = (age: string | null | undefined): number => {
              if (!age) return 0;
              const ageLower = age.toLowerCase();
              const num = parseFloat(ageLower.replace(/[^0-9.]/g, '') || '0');

              if (ageLower.includes('year')) {
                return num * 12;
              } else if (ageLower.includes('month')) {
                return num;
              } else if (ageLower.includes('week')) {
                return num / 4;
              } else if (ageLower.includes('day')) {
                return num / 30;
              }
              return num * 12;
            };

            compareA = parseAgeToMonths(a.age);
            compareB = parseAgeToMonths(b.age);
            break;
          case 'size':
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
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const toggleSort = (column: 'age' | 'size' | 'weight') => {
    if (sortConfig.column === column) {
      if (sortConfig.order === 'desc') {
        setSortConfig({ column, order: 'asc' });
      } else {
        setSortConfig({ column: null, order: 'desc' });
      }
    } else {
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
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-start">
        <TableFilters
          filters={basicFilters}
          onFiltersChange={(newValues) => {
            // Clean up empty arrays and falsy values
            const cleaned = Object.fromEntries(
              Object.entries(newValues).filter(([, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'boolean') return value === true;
                return value !== undefined && value !== null && value !== '';
              }),
            );
            setFilterValues(cleaned);
          }}
          onClearAll={() => setFilterValues({})}
          values={filterValues}
          label="General"
        />
        <TableFilters
          filters={healthFilters}
          onFiltersChange={(newValues) => {
            // Clean up empty arrays and falsy values
            const cleaned = Object.fromEntries(
              Object.entries(newValues).filter(([, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'boolean') return value === true;
                return value !== undefined && value !== null && value !== '';
              }),
            );
            setFilterValues(cleaned);
          }}
          onClearAll={() => setFilterValues({})}
          values={filterValues}
          label="Health Status"
          bgColor="bg-emerald-500"
          icon={<Stethoscope className="h-4 w-4" />}
        />

        <TableFilters
          filters={adoptionFilters}
          onFiltersChange={(newValues) => {
            // Clean up empty arrays and falsy values
            const cleaned = Object.fromEntries(
              Object.entries(newValues).filter(([, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'boolean') return value === true;
                return value !== undefined && value !== null && value !== '';
              }),
            );
            setFilterValues(cleaned);
          }}
          onClearAll={() => setFilterValues({})}
          values={filterValues}
          label="Adoption Info"
          bgColor="bg-orange-600"
          icon={<Dog className="h-4 w-4" />}
        />
      </div>

      {/* Results count and Clear All */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Showing {filteredPets.length} of {pets.length} pets
        </span>
        {Object.keys(filterValues).length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setFilterValues({})}>
            Clear All
          </Button>
        )}
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
                  <TableRow
                    key={pet.id}
                    className={`${pet.adopted ? 'bg-green-50' : odd ? 'bg-gray-100' : ''}`}
                  >
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
                        className={`${getStatusColor(pet.adopted !== null)}`}
                      >
                        {pet.adopted ? 'Adopted' : 'For adoption'}
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
                            {!pet.adopted && (
                              <DropdownMenuItem onClick={() => onEdit?.(pet)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {!pet.adopted && (
                              <DropdownMenuItem
                                onClick={() => onDelete?.(pet.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
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
