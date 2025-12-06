'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Pet } from '@/config/types/pet';
import { Calendar, ExternalLink, Heart, MapPin, Ruler, Weight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const Page = () => {
  const params = useParams();
  const id = params.id as string;
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [recommendedPets, setRecommendedPets] = useState<Pet[]>([]);
  const [showAdoptModal, setShowAdoptModal] = useState<boolean>(false);
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/pets/${id}`);
        const data = await response.json();
        setPet(data.data);
        if (data.data?.photos?.length > 0) {
          setSelectedImage(data.data.photos[0]);
        }
      } catch (error) {
        console.error('Error fetching pet data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    const fetchRecommendedPets = async () => {
      try {
        const response = await fetch(`/api/v1/pets/landing/${id}`);
        const data = await response.json();
        setRecommendedPets(data.data);
      } catch (error) {
        console.error('Error fetching recommended pets:', error);
      }
    };
    fetchRecommendedPets();
    fetchPet();
  }, [id]);
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="w-full h-[400px] rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="w-20 h-20 rounded-md" />
              <Skeleton className="w-20 h-20 rounded-md" />
              <Skeleton className="w-20 h-20 rounded-md" />
              <Skeleton className="w-20 h-20 rounded-md" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Pet not found</h2>
          <p className="text-gray-600 mt-2">The pet you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={selectedImage || pet.photos[0]}
                alt={pet.name ?? 'Pet'}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {pet.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(photo)}
                  className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedImage === photo ? 'border-orange-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={photo}
                    alt={`${pet.name ?? 'pet'} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Pet Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {pet.name && pet.name.length > 0 ? pet.name : 'Unnamed Pet'}
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                {pet.breed} • {pet.gender}
              </p>
            </div>

            <div className="text-gray-700 leading-relaxed">
              {pet.description && pet.description.length > 180 ? (
                <>
                  {showFullDescription ? pet.description : pet.description.slice(0, 180) + '...'}
                  <Button
                    variant="link"
                    className="pl-2 text-orange-500 text-sm"
                    onClick={() => setShowFullDescription((prev) => !prev)}
                  >
                    {showFullDescription ? 'See less' : 'See more'}
                  </Button>
                </>
              ) : (
                pet.description
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <span>{pet.age}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Weight className="w-5 h-5 text-orange-500" />
                  <span>{pet.weight}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Ruler className="w-5 h-5 text-orange-500" />
                  <span>{pet.size}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">{pet.rescue_address}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {pet.is_vaccinated && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Vaccinated
                  </span>
                )}
                {pet.is_spayed_or_neutured && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Spayed/Neutered
                  </span>
                )}
                {pet.is_trained && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    Trained
                  </span>
                )}
              </div>

              {pet.good_with?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Good with:</p>
                  <p className="text-sm text-gray-600">{pet.good_with.join(', ')}</p>
                </div>
              )}

              {pet.special_needs && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Special Needs:</p>
                  <p className="text-sm text-gray-600">{pet.special_needs}</p>
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowAdoptModal(true)}
              className="w-full md:w-fit bg-orange-500 hover:bg-orange-600"
            >
              <Heart className="w-5 h-5" />
              Adopt {pet.name ?? 'Me'}
            </Button>
          </div>
        </div>
      </div>

      {/* Adoption Modal */}
      <Dialog open={showAdoptModal} onOpenChange={setShowAdoptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Continue on Mobile App</DialogTitle>
            <DialogDescription className="text-base pt-2">
              This will take you to the PawsConnect mobile app to continue the adoption process.
              Currently, we only support adoption applications through our mobile app for the best
              experience.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Link href={`https://paws-connect-rho.vercel.app/adopt/${pet.id}`} className="w-full">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                <ExternalLink className="w-4 h-4 mr-2" />
                Continue to App
              </Button>
            </Link>
            <Link
              href="https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/apk/pawsconnect/v1/pawsconnect.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button variant="outline" className="w-full">
                Download the App
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recommended Pets Section */}
      {recommendedPets.length > 0 && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-gray-700 mb-6">Other Pets Looking for Home</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedPets.map((recPet) => (
              <a
                key={recPet.id}
                href={`/pet/${recPet.id}`}
                className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-[200px] w-full">
                  <Image
                    src={recPet.photos[0]}
                    alt={recPet.name ?? 'Pet'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-orange-500 transition-colors">
                    {recPet.name ?? 'Unnamed Pet'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {recPet.breed} • {recPet.age}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{recPet.rescue_address}</span>
                  </div>
                  <Button size="sm" className="w-full mt-3 bg-orange-400 hover:bg-orange-500">
                    View Details
                  </Button>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
