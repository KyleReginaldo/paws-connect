import { supabaseServer } from '@/app/supabase/supabase-server';
import { PollsCard } from '@/components/PollsCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {} from '@/components/ui/tabs';
import { transformUrlsForLocalhost } from '@/lib/url-utils';
import { Baby, BarChart2, Cat, Dog, FileText, Image as ImageIcon, Info, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
function ext(str: string) {
  return {
    isNullOrEmpty: () => str.length === 0,
    textToIcon: () => {
      if (str === 'children') {
        return <Baby className="text-orange-500" size={24} />;
      } else if (str === 'cats') {
        return <Cat className="h-[15px] text-orange-500" size={24} />;
      } else if (str === 'dogs') {
        return <Dog className="h-[15px] text-orange-500" size={24} />;
      } else {
        return <User className="h-[15px] text-orange-500" size={24} />;
      }
    },
  };
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) notFound();

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

  if (error || !pet) notFound();

  const photos: string[] = Array.isArray(pet.photos) ? transformUrlsForLocalhost(pet.photos) : [];

  const displayName = pet.name && pet.name.trim().length > 0 ? pet.name : 'Unnamed Pet';

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 space-y-4">
      {/* Compact header with thumbnail */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative size-14 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
            {photos[0] ? (
              <Image src={photos[0]} alt={displayName} fill className="object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">{displayName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {pet.type && <Badge variant="secondary">{pet.type}</Badge>}
              {pet.gender && <Badge variant="outline">{pet.gender}</Badge>}
              {pet.breed && <Badge variant="outline">{pet.breed}</Badge>}
              <Badge variant="outline">ID: {pet.id}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="text-xs underline text-muted-foreground hover:text-foreground"
            href="/manage-pet"
          >
            Back to list
          </Link>
        </div>
      </div>

      {/* Stacked sections (no tabs) */}
      <div className="w-full space-y-4">
        {/* Overview / Quick facts */}
        <section aria-labelledby="quick-facts">
          <Card className="shadow-sm border-muted/40">
            <CardHeader className="border-b flex items-center gap-3">
              <Info className="h-5 w-5 text-primary" />
              <div>
                <CardTitle id="quick-facts" className="text-sm font-semibold">
                  Quick Facts
                </CardTitle>
                <CardDescription>At a glance</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {pet.age && <Badge variant="secondary">Age: {pet.age}</Badge>}
                {pet.date_of_birth && (
                  <Badge variant="outline">
                    DOB:{' '}
                    {new Date(pet.date_of_birth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Badge>
                )}
                {pet.size && <Badge variant="outline">Size: {pet.size}</Badge>}
                {pet.weight && <Badge variant="outline">Weight: {pet.weight}</Badge>}
                {pet.health_status && <Badge variant="outline">Health: {pet.health_status}</Badge>}
                <Badge variant="outline">Vaccinated: {pet.is_vaccinated ? 'Yes' : 'No'}</Badge>
                <Badge variant="outline">
                  Spayed/Neutered: {pet.is_spayed_or_neutured ? 'Yes' : 'No'}
                </Badge>
                <Badge variant="outline">Potty-Trained: {pet.is_trained ? 'Yes' : 'No'}</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Compatibility */}
        {Array.isArray(pet.good_with) && pet.good_with.length > 0 && (
          <section aria-labelledby="good-with">
            <Card className="shadow-sm border-muted/40">
              <CardHeader className="border-b flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle id="good-with" className="text-sm font-semibold">
                    Good With
                  </CardTitle>
                  <CardDescription>Compatibility</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {pet.good_with.map((g: string, i: number) => (
                    <Badge
                      key={`${g}-${i}`}
                      variant="outline"
                      className="text-[14px] font-normal text-shadow-gray-500"
                    >
                      {ext(g).textToIcon()} {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Rescue address */}
        {pet.rescue_address && (
          <section aria-labelledby="rescue-address">
            <Card className="shadow-sm border-muted/40 p-[8px] m-0">
              <CardHeader className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle id="rescue-address" className="text-sm font-semibold">
                    Rescue Address
                  </CardTitle>
                  <CardDescription>Pickup / Shelter location</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="">
                <p className="text-sm text-muted-foreground leading-6">{pet.rescue_address}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Media / Gallery */}
        <section aria-labelledby="gallery">
          <Card className="shadow-sm border-muted/40">
            <CardHeader className="border-b pb-2 flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-primary" />
              <div>
                <CardTitle id="gallery" className="text-sm font-semibold">
                  Gallery
                </CardTitle>
                <CardDescription>Recent photos</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {photos.length > 0 ? (
                <div className="relative">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {photos.map((src, idx) => (
                        <CarouselItem key={idx} className="md:basis-1/2 lg:basis-1/3">
                          <div className="relative aspect-[16/9] rounded-xl overflow-hidden border bg-muted">
                            <Image
                              src={src || '/placeholder.svg'}
                              alt={`Photo ${idx + 1} of ${displayName}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 800px"
                              priority={idx === 0}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-3" />
                    <CarouselNext className="-right-3" />
                  </Carousel>
                </div>
              ) : (
                <div className="rounded-lg bg-muted h-48 flex items-center justify-center text-muted-foreground">
                  No photos available.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* About */}
        {pet.description ? (
          <section aria-labelledby="about">
            <Card className="shadow-sm border-muted/40">
              <CardHeader className="border-b pb-2 flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle id="about" className="text-sm font-semibold">
                    About
                  </CardTitle>
                  <CardDescription>Temperament, story, notes</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                  {pet.description}
                </p>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* Polls */}
        <section aria-labelledby="polls">
          <Card className="shadow-sm border-muted/40">
            <CardHeader className="border-b pb-2 flex items-center gap-3">
              <BarChart2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle id="polls" className="text-sm font-semibold">
                  Polls
                </CardTitle>
                <CardDescription>User suggestions and votes</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <PollsCard petId={pet.id} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
