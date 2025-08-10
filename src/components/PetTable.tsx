'use client';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Pet } from '../config/types/pet';
import { PhotoViewer } from './PhotoViewer';

interface PetTableProps {
  pets: Pet[];
  onEdit?: (pet: Pet) => void;
  onDelete?: (petId: string) => void;
}

export function PetTable({ pets, onEdit, onDelete }: PetTableProps) {
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; petName: string } | null>(null);

  const getVaccinationBadge = (status: string) => {
    const variants = {
      'up-to-date': 'default',
      partial: 'secondary',
      overdue: 'destructive',
      unknown: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </Badge>
    );
  };

  const getSpeciesEmoji = (species: string) => {
    const emojis = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      rabbit: '🐰',
      hamster: '🐹',
      fish: '🐠',
      reptile: '🦎',
      other: '🐾',
    };
    return emojis[species as keyof typeof emojis] || '🐾';
  };

  const openPhotoViewer = (photoUrl: string, petName: string) => {
    setSelectedPhoto({ url: photoUrl, petName });
    setPhotoViewerOpen(true);
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
            <TableHead>Species & Breed</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Vaccination</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pets.map((pet) => (
            <TableRow key={pet.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar
                    className="h-10 w-10 cursor-pointer"
                    onClick={() => pet.photo && openPhotoViewer(pet.photo, pet.name)}
                  >
                    <AvatarImage
                      src={pet.photo || '/placeholder.svg?height=40&width=40&query=pet'}
                      alt={pet.name}
                      className="object-cover"
                    />
                    {/* <AvatarFallback>{getSpeciesEmoji(pet.species)}</AvatarFallback> */}
                  </Avatar>
                  <div>
                    <div className="font-medium">{pet.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {pet.gender} • {pet.color}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-sm text-muted-foreground">{pet.breed || 'Mixed breed'}</div>
                </div>
              </TableCell>
              <TableCell>
                {pet.created_at ? (
                  <div>
                    <div className="font-medium">{pet.age} years</div>
                    <div className="text-sm text-muted-foreground">
                      Born {format(new Date(pet.created_at), 'MMM yyyy')}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </TableCell>
              <TableCell>{pet.weight ? `${pet.weight}` : 'Not specified'}</TableCell>
              <TableCell>{pet.is_vaccinated ? 'Vaccinated' : 'Not Vaccinated'}</TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(pet.created_at), 'MMM d, yyyy')}
                </div>
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
                      onClick={() => onDelete?.(pet.id.toString())}
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
      {selectedPhoto && (
        <PhotoViewer
          open={photoViewerOpen}
          onOpenChange={setPhotoViewerOpen}
          photoUrl={selectedPhoto.url}
          petName={selectedPhoto.petName}
        />
      )}
    </div>
  );
}
