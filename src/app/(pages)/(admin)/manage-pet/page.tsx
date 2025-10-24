'use client';

import { useAuth } from '@/app/context/AuthContext';
import { usePets } from '@/app/context/PetsContext';
import { PetModal } from '@/components/PetModal';
import { PetTableFiltered } from '@/components/PetTableFiltered';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notification';
import { Pet } from '@/config/types/pet';
import { Dog, Download, Plus, SwatchBook, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export default function PetManagement() {
  const { pets, addPet, updatePet, deletePet: deletePetFromContext } = usePets();
  const { userId } = useAuth();
  const { success, error, warning } = useNotifications();
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
    await deletePetFromContext(id);
  };

  const handleImport = async (file: File) => {
    if (!file) return;

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
        added_by: userId,
        photos: String(r.photo ?? '').trim() ? [String(r.photo).trim()] : ['/empty_pet.png'],
      };

      return normalized;
    };

    const reader = new FileReader();
    try {
      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        reader.onload = async (ev: ProgressEvent<FileReader>) => {
          try {
            const data = ev.target?.result as ArrayBuffer;
            const workbook = XLSX.read(data, { type: 'array' });
            const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(
              workbook.Sheets[workbook.SheetNames[0]],
              { defval: '' },
            );

            if (json.length === 0) {
              error(
                'No Data Found',
                'The Excel file appears to be empty or contains no valid data.',
              );
              setIsImporting(false);
              return;
            }

            const normalized = json.map(normalizeRow);

            const resp = await fetch('/api/v1/pets/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pets: normalized }),
            });

            const result = await resp.json().catch(() => ({}));

            if (!resp.ok) {
              const message = result?.message || 'Import failed';
              const errors = result?.errors ? JSON.stringify(result.errors, null, 2) : '';
              error(`${message}${errors ? '\n' + errors : ''}`);
              setIsImporting(false);
              return;
            }

            const created = result.created || 0;
            success(`Import succeeded! ${created} pets created.`);

            window.location.reload();
          } catch (err) {
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
      error('Import failed: ' + String(err));
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
            <Dog className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{pets ? pets.length : 0}</span>
            <span className="text-xs opacity-75">Total Pets</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
            <SwatchBook className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">
              {pets ? [...new Set(pets.map((pet) => pet.type))].length : 0}
            </span>
            <span className="text-xs opacity-75">Pet Types</span>
          </div>
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

          <Button onClick={openAddModal} className="gap-2 rounded-full" size={'sm'}>
            <Plus className="h-4 w-4" />
            Add Pet
          </Button>
        </div>
      </div>

      {pets && pets.length > 0 ? (
        <PetTableFiltered pets={pets} onEdit={openEditModal} onDelete={handleDeletePet} />
      ) : (
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
        onSubmit={async (petData, photoFiles) => {
          try {
            if (!editingPet) {
              const result = await addPet(petData, photoFiles);
              if (result) {
                success('Pet Added Successfully', `${petData.name} has been added to the system.`);
              } else {
                error('Failed to Add Pet', 'Please check the form data and try again.');
              }
            } else {
              // For updates, check if we have new files or just updating existing data
              if (photoFiles && photoFiles.length > 0) {
                // Use FormData if there are new files
                const formData = new FormData();

                console.log('🔧 Building FormData with petData:', {
                  ...petData,
                  color: `"${petData.color}"`, // Show color explicitly
                });

                // Add all pet data fields
                Object.entries(petData).forEach(([key, value]) => {
                  if (key === 'photos') {
                    // Handle existing photos separately
                    if (Array.isArray(value) && value.length > 0) {
                      value.forEach((photoUrl) => {
                        if (typeof photoUrl === 'string') {
                          formData.append('existing_photos', photoUrl);
                        }
                      });
                    }
                  } else if (key === 'good_with') {
                    // Handle array fields
                    if (Array.isArray(value)) {
                      value.forEach((item) => {
                        if (typeof item === 'string') {
                          formData.append('good_with[]', item);
                        }
                      });
                    }
                  } else if (value !== null && value !== undefined) {
                    console.log(`📝 Adding to FormData: ${key} = "${value}"`);
                    formData.append(key, String(value));
                  }
                });

                // Add new photo files
                photoFiles.forEach((file) => {
                  formData.append('photos', file);
                });

                const result = await updatePet(editingPet.id, formData);
                if (result) {
                  success('Pet Updated Successfully', `${petData.name} has been updated.`);
                } else {
                  error('Failed to Update Pet', 'Please check the form data and try again.');
                }
              } else {
                // Use JSON if no new files
                console.log('📄 Sending JSON update with petData:', {
                  ...petData,
                  color: `"${petData.color}"`, // Show color explicitly
                });
                const result = await updatePet(editingPet.id, petData);
                if (result) {
                  success('Pet Updated Successfully', `${petData.name} has been updated.`);
                } else {
                  error('Failed to Update Pet', 'Please check the form data and try again.');
                }
              }
            }
          } catch (err) {
            console.error('Pet submission error:', err);
            const errorMessage =
              err instanceof Error ? err.message : 'An unexpected error occurred';
            error('Pet Operation Failed', errorMessage);
          }
        }}
        editingPet={editingPet}
      />
    </div>
  );
}
