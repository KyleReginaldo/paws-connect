'use client';

import { useAuth } from '@/app/context/AuthContext';
import { usePets } from '@/app/context/PetsContext';
import { PetModal } from '@/components/PetModal';
import { PetTable } from '@/components/PetTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notification';
import { Pet } from '@/config/types/pet';
import { Download, Plus, Search, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export default function PetManagement() {
  const { pets, addPet, updatePet, deletePet: deletePetFromContext } = usePets();
  const { userId } = useAuth();
  const { success, error, warning } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
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

  const handleImport = async (file: File) => {
    if (!file) return;

    console.log('Import started with file:', file.name);
    setIsImporting(true);

    if (!userId) {
      error('Authentication Required', 'You must be signed in as an admin to import pets.');
      setIsImporting(false);
      return;
    }

    const toBool = (v: unknown) => {
      if (typeof v === 'boolean') return v;
      const s = String(v ?? '').toLowerCase();
      return s === 'true' || s === 'yes' || s === '1' || s === 'y';
    };

    const parseDate = (v: unknown) => {
      if (!v) return '';
      const d = new Date(String(v));
      if (isNaN(d.getTime())) return String(v);
      return d.toISOString().split('T')[0];
    };

    const normalizeRow = (r: Record<string, unknown>) => {
      console.log('Raw imported row:', r);

      // Handle good_with array - exported as comma-separated string
      const gwRaw =
        (r as Record<string, unknown>).good_with ??
        (r as Record<string, unknown>).goodWith ??
        (r as Record<string, unknown>)['Good With'] ??
        (r as Record<string, unknown>)['Good_With'] ??
        '';
      const goodWithArr = Array.isArray(gwRaw)
        ? gwRaw
        : String(gwRaw || '')
            .split(/[,|;]/)
            .map((s) => s.trim())
            .filter(Boolean);

      const normalized = {
        // All required fields for createPetSchema
        name: String(r.name ?? '').trim() || 'Unknown',
        type: String(r.type ?? '').trim() || 'Dog',
        breed: String(r.breed ?? '').trim() || 'Mixed',
        gender: String(r.gender ?? '').trim() || 'Unknown',
        age: Math.max(1, Number(r.age) || 1),
        date_of_birth: parseDate(r.date_of_birth) || new Date().toISOString().split('T')[0],
        size: String(r.size ?? '').trim() || 'medium',
        weight: String(r.weight ?? '').trim() || '10',
        is_vaccinated: toBool(r.is_vaccinated),
        is_spayed_or_neutured: toBool(r.is_spayed_or_neutured),
        health_status: String(r.health_status ?? '').trim() || 'Unknown',
        good_with: goodWithArr,
        is_trained: toBool(r.is_trained),
        rescue_address: String(r.rescue_address ?? '').trim() || '',
        description: String(r.description ?? '').trim() || '',
        special_needs: String(r.special_needs ?? '').trim() || '',
        added_by: userId, // Always use current user
        photos: String(r.photo ?? '').trim() ? [String(r.photo).trim()] : ['/empty_pet.png'], // Default photo if none provided
      };

      console.log('Normalized row:', normalized);
      return normalized;
    };

    const reader = new FileReader();
    try {
      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        reader.onload = async (ev: ProgressEvent<FileReader>) => {
          try {
            console.log('Parsing XLSX file...');
            const data = ev.target?.result as ArrayBuffer;
            const workbook = XLSX.read(data, { type: 'array' });
            const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(
              workbook.Sheets[workbook.SheetNames[0]],
              { defval: '' },
            );

            console.log('Raw XLSX data:', json);

            if (json.length === 0) {
              error(
                'No Data Found',
                'The Excel file appears to be empty or contains no valid data.',
              );
              setIsImporting(false);
              return;
            }

            // exported file uses the full pet objects; normalize each row to create shape
            const normalized = json.map(normalizeRow);

            console.log('Sending to bulk API:', { pets: normalized });

            const resp = await fetch('/api/v1/pets/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pets: normalized }),
            });

            console.log('API response status:', resp.status);
            const result = await resp.json().catch(() => ({}));
            console.log('API response data:', result);

            if (!resp.ok) {
              const message = result?.message || 'Import failed';
              const errors = result?.errors ? JSON.stringify(result.errors, null, 2) : '';
              console.error('Import failed:', message, errors);
              error(`${message}${errors ? '\n' + errors : ''}`);
              setIsImporting(false);
              return;
            }

            const created = result.created || 0;
            success(`Import succeeded! ${created} pets created.`);

            // Refresh pets context instead of full page reload
            window.location.reload();
          } catch (err) {
            console.error('Excel parsing error:', err);
            error('Failed to parse Excel file: ' + String(err));
            setIsImporting(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        warning('Please select an Excel file (.xlsx)');
        setIsImporting(false);
      }
    } catch (err) {
      console.error('Import failed:', err);
      error('Import failed: ' + String(err));
      setIsImporting(false);
    }
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

  useEffect(() => {
    console.log(`user id: ${userId}`);
  }, [userId]);
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
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
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImport(file);
              }
            }}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="rounded-full px-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-95 shadow-sm"
              title="Import pets"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importing...' : 'Import'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Export pets to Excel - format good_with array as comma-separated string
                const exportData = (pets || []).map((pet) => ({
                  ...pet,
                  good_with: Array.isArray(pet.good_with)
                    ? pet.good_with.join(', ')
                    : pet.good_with,
                }));
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Pets');
                XLSX.writeFile(wb, 'pets_export.xlsx');
              }}
              className="rounded-full px-3 shadow-sm hover:shadow-md"
              title="Export pets"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Pet
          </Button>
        </div>
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
