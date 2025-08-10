'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { PhotoViewer } from './PhotoViewer';
import { useState } from 'react';
import type { Pet } from '../config/types/pet';

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
                    <AvatarFallback>{getSpeciesEmoji(pet.species)}</AvatarFallback>
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
                  <div className="font-medium capitalize">{pet.species}</div>
                  <div className="text-sm text-muted-foreground">{pet.breed || 'Mixed breed'}</div>
                </div>
              </TableCell>
              <TableCell>
                {pet.birthDate ? (
                  <div>
                    <div className="font-medium">
                      {Math.floor(
                        (new Date().getTime() - pet.birthDate.getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000),
                      )}{' '}
                      years
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Born {format(pet.birthDate, 'MMM yyyy')}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </TableCell>
              <TableCell>{pet.weight ? `${pet.weight} lbs` : 'Not specified'}</TableCell>
              <TableCell>{getVaccinationBadge(pet.vaccinated)}</TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {format(pet.dateAdded, 'MMM d, yyyy')}
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
