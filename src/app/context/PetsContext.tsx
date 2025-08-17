'use client';
import { Pet } from '@/config/types/pet';
import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';

export enum PetsStatus {
  loading,
  loaded,
  error,
}

type PetsContextType = {
  pets: Pet[] | null;
  status: PetsStatus;
  errorMessage: string | undefined;
  fetchPets: () => Promise<void>;
  addPet: (petData: Omit<Pet, 'id'>) => Promise<Pet | null>;
  updatePet: (id: number, petData: Partial<Pet>) => Promise<Pet | null>;
  deletePet: (id: number) => Promise<boolean>;
  refreshPets: () => Promise<void>;
};

const PetsContext = createContext<PetsContextType | undefined>(undefined);

export const PetsProvider = ({ children }: { children: React.ReactNode }) => {
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [status, setStatus] = useState<PetsStatus>(PetsStatus.loading);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const fetchPets = async () => {
    try {
      setStatus(PetsStatus.loading);
      setErrorMessage(undefined);
      const response = await axios.get('/api/v1/pets');
      setPets(response.data.data);
      setStatus(PetsStatus.loaded);
    } catch (error) {
      console.error('Error fetching pets:', error);
      setStatus(PetsStatus.error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch pets');
    }
  };

  const addPet = async (petData: Omit<Pet, 'id'>): Promise<Pet | null> => {
    try {
      const response = await axios.post('/api/v1/pets', petData);
      const newPet = response.data.data;
      setPets((prev) => (prev ? [...prev, newPet] : [newPet]));
      return newPet;
    } catch (error) {
      console.error('Error adding pet:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add pet');
      return null;
    }
  };

  const updatePet = async (id: number, petData: Partial<Pet>): Promise<Pet | null> => {
    try {
      console.log('UpdatePet called with:', {
        id,
        petData: { ...petData, photo: petData.photo ? 'Photo data present' : 'No photo' },
      });
      const response = await axios.put(`/api/v1/pets/${id}`, petData);
      console.log('API response:', response.data);
      const updatedPet = response.data.data;

      if (!updatedPet) {
        console.error('No updated pet data returned from API');
        // If no updated pet is returned, refresh the pets list
        await fetchPets();
        return null;
      }

      setPets((prev) => {
        const newPets = prev
          ? prev.map((pet) => {
              if (pet.id === id) {
                console.log(
                  'Pet updated successfully with photo:',
                  updatedPet.photo ? 'Yes' : 'No',
                );
                return updatedPet;
              }
              return pet;
            })
          : null;
        return newPets;
      });
      return updatedPet;
    } catch (error) {
      console.error('Error updating pet:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update pet');
      return null;
    }
  };

  const deletePet = async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`/api/v1/pets/${id}`);
      setPets((prev) => (prev ? prev.filter((pet) => pet.id !== id) : null));
      return true;
    } catch (error) {
      console.error('Error deleting pet:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete pet');
      return false;
    }
  };

  const refreshPets = async () => {
    await fetchPets();
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchPets();
  }, []);

  return (
    <PetsContext.Provider
      value={{
        pets,
        status,
        errorMessage,
        fetchPets,
        addPet,
        updatePet,
        deletePet,
        refreshPets,
      }}
    >
      {children}
    </PetsContext.Provider>
  );
};

export const usePets = () => {
  const context = useContext(PetsContext);
  if (context === undefined) {
    throw new Error('usePets must be used within a PetsProvider');
  }
  return context;
};
