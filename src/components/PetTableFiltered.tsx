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
import { getPetAgeLabel } from '@/lib/pet-age';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
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

interface PetTableProps {
  pets: Pet[];
  onEdit?: (pet: Pet) => void;
  onDelete?: (petId: number) => void;
}

export function PetTableFiltered({ pets, onEdit, onDelete }: PetTableProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

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
      label: 'Breed',
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
      placeholder: 'Select statuses',
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

  // Apply filters
  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
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
  }, [pets, filterValues]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'default'; // green
      case 'pending':
        return 'secondary'; // yellow/orange
      case 'rejected':
        return 'destructive'; // red
      default:
        return 'outline'; // gray
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
                <TableHead>Breed</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Request Status</TableHead>
                <TableHead>Vaccination Status</TableHead>
                <TableHead>Spayed/Neutered</TableHead>
                <TableHead>Health Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPets.map((pet) => (
                <TableRow key={pet.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={(pet.photos && pet.photos.length > 0 ? pet.photos[0] : null) || ''}
                            alt={pet.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-muted">
                            {pet.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Show happiness image if pet is adopted and has one */}
                        {pet.adopted && pet.adopted.happiness_image && (
                          <div className="absolute -top-2 -right-2">
                            <HappinessImageDisplay
                              happinessImage={pet.adopted.happiness_image}
                              petName={pet.name}
                              size="sm"
                              showLabel={false}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{pet.name}</div>
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
                  <TableCell>{getPetAgeLabel(pet.date_of_birth, pet.age)}</TableCell>
                  <TableCell>{pet.size}</TableCell>
                  <TableCell>{pet.weight ? `${pet.weight}` : 'Not specified'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(pet.request_status)}>
                      {pet.request_status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>{pet.is_vaccinated ? 'Vaccinated' : 'Not Vaccinated'}</TableCell>
                  <TableCell>
                    {pet.is_spayed_or_neutured ? 'Spayed/Neutered' : 'Not Spayed/Neutered'}
                  </TableCell>
                  <TableCell>{pet.health_status || 'Unknown'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                  </TableCell>
                </TableRow>
              ))}
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
