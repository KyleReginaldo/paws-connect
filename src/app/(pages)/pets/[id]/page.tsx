import { supabaseServer } from '@/app/supabase/supabase-server';
import { transformUrlsForLocalhost } from '@/lib/url-utils';
import Image from 'next/image';
import { notFound } from 'next/navigation';

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

export default async function PetDetailPage({ params }: { params: { id: string } }) {
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    notFound();
  }

  const { data: pet, error } = await supabaseServer
    .from('pets')
    .select(
      `
        id, name, type, breed, gender, age, date_of_birth,
        size, weight, is_vaccinated, is_spayed_or_neutured, is_trained,
        health_status, good_with, rescue_address, description, photos
      `,
    )
    .eq('id', idNum)
    .single();

  if (error || !pet) {
    notFound();
  }

  const photos: string[] = Array.isArray(pet.photos) ? transformUrlsForLocalhost(pet.photos) : [];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">
          {pet.name && pet.name.trim().length > 0 ? pet.name : 'Unnamed Pet'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Pet ID: {pet.id}</p>
      </div>

      {/* Gallery */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {photos.map((src, idx) => (
            <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={src || '/placeholder.svg'}
                alt={`Photo ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <div className="relative w-full aspect-[3/2] overflow-hidden rounded-lg border bg-muted" />
          <p className="text-sm text-muted-foreground mt-2">No photos available.</p>
        </div>
      )}

      {/* Quick facts */}
      <div className="flex flex-wrap gap-2 mb-8">
        {pet.type && <Badge>Type: {pet.type}</Badge>}
        {pet.breed && <Badge>Breed: {pet.breed}</Badge>}
        {pet.gender && <Badge>Gender: {pet.gender}</Badge>}
        {pet.age && <Badge>Age: {pet.age}</Badge>}
        {pet.size && <Badge>Size: {pet.size}</Badge>}
        {pet.weight && <Badge>Weight: {pet.weight}</Badge>}
        {pet.health_status && <Badge>Health: {pet.health_status}</Badge>}
        <Badge>Vaccinated: {pet.is_vaccinated ? 'Yes' : 'No'}</Badge>
        <Badge>Spayed/Neutered: {pet.is_spayed_or_neutured ? 'Yes' : 'No'}</Badge>
        <Badge>Potty-train: {pet.is_trained ? 'Yes' : 'No'}</Badge>
      </div>

      {/* Good with */}
      {Array.isArray(pet.good_with) && pet.good_with.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-2">Good with</h2>
          <div className="flex flex-wrap gap-2">
            {pet.good_with.map((g: string, i: number) => (
              <Badge key={`${g}-${i}`}>{g.charAt(0).toUpperCase() + g.slice(1)}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {pet.description && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-2">About</h2>
          <p className="text-sm leading-6 whitespace-pre-wrap">{pet.description}</p>
        </div>
      )}

      {/* Rescue address */}
      {pet.rescue_address && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-2">Rescue Address</h2>
          <p className="text-sm text-muted-foreground">{pet.rescue_address}</p>
        </div>
      )}
    </div>
  );
}
