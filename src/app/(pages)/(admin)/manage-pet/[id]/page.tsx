import { supabaseServer } from '@/app/supabase/supabase-server';
import { PollsCard } from '@/components/PollsCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { transformUrlsForLocalhost } from '@/lib/url-utils';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function PetDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const idNum = Number(id);
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

  const displayName = pet.name && pet.name.trim().length > 0 ? pet.name : 'Unnamed Pet';

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">Pet ID:</span>
          <span className="tabular-nums">{pet.id}</span>
          <Separator className="mx-2 w-px h-4" orientation="vertical" />
          {pet.type && <Badge variant="secondary">{pet.type}</Badge>}
          {pet.gender && <Badge variant="outline">{pet.gender}</Badge>}
          {pet.breed && <Badge variant="outline">{pet.breed}</Badge>}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left column: media + narrative */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-5">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Gallery</CardTitle>
              <CardDescription>Visuals provided for review</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {photos.length > 0 ? (
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {/* Emphasize the first photo */}
                  <div className="relative col-span-2 sm:col-span-3 lg:col-span-3 aspect-[21/9] overflow-hidden rounded-lg border">
                    <Image
                      src={photos[0] || '/placeholder.svg'}
                      alt={`Primary photo of ${displayName}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 800px"
                      className="object-cover"
                      priority
                    />
                  </div>
                  {photos.slice(1).map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-lg border"
                    >
                      <Image
                        src={src || '/placeholder.svg'}
                        alt={`Photo ${idx + 2} of ${displayName}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="relative w-full aspect-[21/9] overflow-hidden rounded-lg border bg-muted" />
                  <p className="text-sm text-muted-foreground mt-2">No photos available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {pet.description && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">About</CardTitle>
                <CardDescription>Temperament, story, and notes</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm leading-7 whitespace-pre-wrap">{pet.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: facts + compatibility + logistics */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6 lg:sticky lg:top-24 self-start">
          {pet.name ? null : <PollsCard petId={pet.id} />}

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Quick facts</CardTitle>
              <CardDescription>Key attributes at a glance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-2">
                {pet.age && <Badge variant="secondary">Age: {pet.age}</Badge>}
                {pet.date_of_birth && (
                  <Badge variant="secondary">
                    DOB: {new Date(pet.date_of_birth).toLocaleDateString()}
                  </Badge>
                )}
                {pet.size && <Badge variant="outline">Size: {pet.size}</Badge>}
                {pet.weight && <Badge variant="outline">Weight: {pet.weight}</Badge>}
                {pet.health_status && <Badge variant="outline">Health: {pet.health_status}</Badge>}
                <Badge variant="outline">Vaccinated: {pet.is_vaccinated ? 'Yes' : 'No'}</Badge>
                <Badge variant="outline">
                  Spayed/Neutered: {pet.is_spayed_or_neutured ? 'Yes' : 'No'}
                </Badge>
                <Badge variant="outline">Potty-train: {pet.is_trained ? 'Yes' : 'No'}</Badge>
              </div>
            </CardContent>
          </Card>

          {Array.isArray(pet.good_with) && pet.good_with.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Good with</CardTitle>
                <CardDescription>Compatibility indicators</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {pet.good_with.map((g: string, i: number) => (
                    <Badge key={`${g}-${i}`} variant="secondary">
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pet.rescue_address && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Rescue address</CardTitle>
                <CardDescription>Pickup or shelter location</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground leading-6">{pet.rescue_address}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
