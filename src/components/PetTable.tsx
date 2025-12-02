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
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Pet } from '../config/types/pet';
import { HappinessImageDisplay } from './HappinessImageDisplay';
import { PhotoViewer } from './PhotoViewer';
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

export function PetTable({ pets, onEdit, onDelete }: PetTableProps) {
  // Debug logging to see what's in the pets data
  console.log('PetTable received pets:', pets);
  if (pets.length > 0) {
    console.log('First pet data:', pets);
  }

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

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  const handleAvatarClick = (pet: Pet) => {
    if (pet.photos && pet.photos.length > 0) {
      setSelectedPet(pet);
      setViewerOpen(true);
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pet</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Breed/Pattern</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Request Status</TableHead>
            <TableHead>Vaccination status</TableHead>
            <TableHead>Spayed/Neutered</TableHead>
            <TableHead>Actions</TableHead>

            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pets.map((pet) => (
            <TableRow key={pet.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      className="h-10 w-10 cursor-zoom-in"
                      onClick={() => handleAvatarClick(pet)}
                      title="Click to zoom or view details"
                    >
                      <AvatarImage
                        src={(pet.photos && pet.photos.length > 0 ? pet.photos[0] : null) || ''}
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
                      <div className="text-xs text-green-600 font-medium">✨ Adopted & Happy</div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>{pet.type}</TableCell>
              <TableCell>{pet.breed}</TableCell>
              <TableCell>{pet.gender}</TableCell>
              <TableCell>{pet.age}</TableCell>
              <TableCell>
                {pet.size}
                {/* <div className="text-sm text-muted-foreground">
                  {format(new Date(pet.created_at), 'MMM d, yyyy')}
                </div> */}
              </TableCell>
              <TableCell>{pet.weight ? `${pet.weight}` : 'Not specified'}</TableCell>
              <TableCell>
                <Badge
                  variant={getStatusBadgeVariant(pet.request_status)}
                  className={`${pet.request_status === 'approved' ? 'bg-green-500' : null}`}
                >
                  {pet.request_status || 'pending'}
                </Badge>
              </TableCell>
              <TableCell>{pet.is_vaccinated ? 'Vaccinated' : 'Not Vaccinated'}</TableCell>
              <TableCell>
                {pet.is_spayed_or_neutured ? 'Spayed/Neutered' : 'Not Spayed/Neutered'}
              </TableCell>
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
      {selectedPet && (
        <PhotoViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          photoUrl={(selectedPet.photos && selectedPet.photos[0]) || ''}
          petName={selectedPet.name || 'Unnamed Pet'}
          detailsHref={`/manage-pet/${selectedPet.id}`}
        />
      )}
    </div>
  );
}
