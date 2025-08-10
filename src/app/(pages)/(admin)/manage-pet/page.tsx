'use client';

import { PetModal } from '@/components/PetModal';
import { PetTable } from '@/components/PetTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pet } from '@/config/types/pet';
import axios from 'axios';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PetManagement() {
  const [pets, setPets] = useState<Pet[] | null>(null);
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

  useEffect(() => {
    const onFetchPets = async () => {
      try {
        const response = await axios.get('/api/v1/pets');
        setPets(response.data['data']);
      } catch (error) {
        // Optionally handle error UI
        console.error('Error fetching pets:', error);
      }
    };
    onFetchPets();
  }, []);

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold">{pets ? pets.length : 0}</div>
          <div className="text-sm text-muted-foreground">Total Pets</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          {/* TODO: Replace 'test' with actual vaccination stats */}
          <div className="text-2xl font-bold">-</div>
          <div className="text-sm text-muted-foreground">Up-to-date Vaccinations</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          {/* TODO: Replace 'test' with actual species stats */}
          <div className="text-2xl font-bold">-</div>
          <div className="text-sm text-muted-foreground">Different Species</div>
        </div>
      </div>

      {pets && <PetTable pets={pets} onEdit={openEditModal} onDelete={() => {}} />}

      <PetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={async (petData) => {
          if (!editingPet) {
            try {
              const response = await axios.post('/api/v1/pets', petData);
              console.log(response.data);
              setPets((prev) => (prev ? [...prev, response.data.data] : [response.data.data]));
            } catch (error) {
              console.error('Error adding pet:', error);
            }
          }
        }}
        editingPet={editingPet}
      />
    </div>
  );
}
