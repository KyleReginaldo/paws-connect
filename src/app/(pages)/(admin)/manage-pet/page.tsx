'use client';

import { usePets } from '@/app/context/PetsContext';
import { PetModal } from '@/components/PetModal';
import { PetTable } from '@/components/PetTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pet } from '@/config/types/pet';
import { Plus, Search, X } from 'lucide-react';
import { useState } from 'react';

export default function PetManagement() {
  const { pets, addPet, updatePet, deletePet: deletePetFromContext } = usePets();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const openEditModal = (pet: Pet) => {
    setEditingPet(pet);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingPet(null);
    setModalOpen(true);
  };

  const handleDeletePet = async (id: number) => {
    console.log('Deleting pet with id:', id);
    await deletePetFromContext(id);
  };

  // Filter pets based on search query
  const filteredPets =
    pets?.filter((pet) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        pet.name.toLowerCase().includes(query) ||
        pet.type.toLowerCase().includes(query) ||
        (pet.breed && pet.breed.toLowerCase().includes(query))
      );
    }) || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pet Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage all your pets in one place. Keep track of their information, medical records, and
          important details.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search pets by name, type, or breed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Pet
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold">{pets ? pets.length : 0}</div>
          <div className="text-sm text-muted-foreground">Total Pets</div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {pets ? [...new Set(pets.map((pet) => pet.type))].length : 0}
          </div>
          <div className="text-sm text-muted-foreground">Pet Types</div>
        </div>
      </div>

      {pets && filteredPets.length > 0 && (
        <PetTable pets={filteredPets} onEdit={openEditModal} onDelete={handleDeletePet} />
      )}

      {pets && filteredPets.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-muted-foreground mb-2">
            No pets found matching &quot;{searchQuery}&quot;
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            Try searching by a different name, type, or breed
          </div>
          <Button onClick={() => setSearchQuery('')} variant="outline">
            Clear Search
          </Button>
        </div>
      )}

      {pets && pets.length === 0 && !searchQuery && (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-muted-foreground mb-2">No pets yet</div>
          <div className="text-sm text-muted-foreground mb-4">
            Get started by adding your first pet
          </div>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Pet
          </Button>
        </div>
      )}

      <PetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={async (petData) => {
          if (!editingPet) {
            // Adding a new pet
            const newPet = await addPet(petData);
            if (newPet) {
              console.log('Pet added successfully:', newPet);
            }
          } else {
            // Updating existing pet
            console.log(`editing pet:${editingPet.id}`);
            const updatedPet = await updatePet(editingPet.id, petData);
            if (updatedPet) {
              console.log('Pet updated successfully:', updatedPet);
            }
          }
        }}
        editingPet={editingPet}
      />
    </div>
  );
}
