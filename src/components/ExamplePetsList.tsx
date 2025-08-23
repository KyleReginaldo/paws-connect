'use client';
import { PetsStatus, usePets } from '@/app/context/PetsContext';

// Example component showing how to use the PetsContext
export function PetsList() {
  const { pets, status, errorMessage, refreshPets } = usePets();

  if (status === PetsStatus.loading) {
    return <div>Loading pets...</div>;
  }

  if (status === PetsStatus.error) {
    return (
      <div>
        <p>Error: {errorMessage}</p>
        <button onClick={refreshPets}>Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <h2>All Pets ({pets?.length || 0})</h2>
      <button onClick={refreshPets}>Refresh</button>
      {pets?.map((pet) => (
        <div key={pet.id}>
          <h3>{pet.name}</h3>
          <p>
            {pet.type} - {pet.breed}
          </p>
        </div>
      ))}
    </div>
  );
}
