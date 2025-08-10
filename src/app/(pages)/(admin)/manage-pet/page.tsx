'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Pet } from '@/config/types/pet';
import { PetTable } from '@/components/PetTable';
import { PetModal } from '@/components/PetModal';

// Mock data for demonstration
const mockPets: Pet[] = [
  {
    id: '1',
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    gender: 'male',
    birthDate: new Date('2020-03-15'),
    weight: '65',
    color: 'Golden',
    description: 'Friendly and energetic dog who loves playing fetch.',
    microchipId: '123456789012345',
    vaccinated: 'up-to-date',
    dateAdded: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Whiskers',
    species: 'cat',
    breed: 'Persian',
    gender: 'female',
    birthDate: new Date('2019-07-22'),
    weight: '12',
    color: 'White and gray',
    description: 'Calm and affectionate cat who enjoys sunny windowsills.',
    microchipId: '987654321098765',
    vaccinated: 'up-to-date',
    dateAdded: new Date('2024-02-01'),
  },
  {
    id: '3',
    name: 'Charlie',
    species: 'bird',
    breed: 'Cockatiel',
    gender: 'male',
    weight: '0.2',
    color: 'Yellow and gray',
    description: 'Talkative bird who knows several phrases.',
    microchipId: '',
    vaccinated: 'partial',
    dateAdded: new Date('2024-02-20'),
  },
];

export default function PetManagement() {
  const [pets, setPets] = useState<Pet[]>(mockPets);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const filteredPets = useMemo(() => {
    if (!searchQuery) return pets;

    return pets.filter(
      (pet) =>
        pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.color.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [pets, searchQuery]);

  const handleAddPet = (petData: Omit<Pet, 'id' | 'dateAdded'>) => {
    const newPet: Pet = {
      ...petData,
      id: Date.now().toString(),
      dateAdded: new Date(),
    };
    setPets((prev) => [...prev, newPet]);
  };

  const handleEditPet = (petData: Omit<Pet, 'id' | 'dateAdded'>) => {
    if (!editingPet) return;

    setPets((prev) =>
      prev.map((pet) =>
        pet.id === editingPet.id ? { ...petData, id: pet.id, dateAdded: pet.dateAdded } : pet,
      ),
    );
    setEditingPet(null);
  };

  const handleDeletePet = (petId: string) => {
    setPets((prev) => prev.filter((pet) => pet.id !== petId));
  };

  const openEditModal = (pet: Pet) => {
    setEditingPet(pet);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingPet(null);
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pet Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage all your pets in one place. Keep track of their information, medical records, and
          important details.
        </p>
      </div>

      {/* Search and Add Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search pets by name, species, breed, or color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Pet
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold">{pets.length}</div>
          <div className="text-sm text-muted-foreground">Total Pets</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {pets.filter((pet) => pet.vaccinated === 'up-to-date').length}
          </div>
          <div className="text-sm text-muted-foreground">Up-to-date Vaccinations</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold">{new Set(pets.map((pet) => pet.species)).size}</div>
          <div className="text-sm text-muted-foreground">Different Species</div>
        </div>
      </div>

      {/* Pets Table */}
      <PetTable pets={filteredPets} onEdit={openEditModal} onDelete={handleDeletePet} />

      {/* Pet Modal */}
      <PetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editingPet ? handleEditPet : handleAddPet}
        editingPet={editingPet}
      />
    </div>
  );
}
