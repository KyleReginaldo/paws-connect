'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pet } from '@/config/types/pet';
import { Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AllPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/pets/all');
        const data = await response.json();
        setPets(data.data || []);
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPets();
  }, []);

  const filteredPets = pets.filter(
    (pet) =>
      (pet.name && pet.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-700 mb-2">Available Pets for Adoption</h1>
          <p className="text-gray-600">Find your perfect companion</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, breed, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[250px] w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                Showing {filteredPets.length} of {pets.length} pets
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPets.map((pet) => (
                <Link
                  key={pet.id}
                  href={`/pet/${pet.id}`}
                  className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-[250px] w-full">
                    <Image
                      src={pet.photos[0]}
                      alt={pet.name ?? 'Pet'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-orange-500 transition-colors">
                      {pet.name ?? 'No name'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {pet.breed} • {pet.age}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pet.description}</p>
                    <Button size="sm" className="w-full mt-3 bg-orange-400 hover:bg-orange-500">
                      View Details
                    </Button>
                  </div>
                </Link>
              ))}
            </div>

            {filteredPets.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">No pets found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
