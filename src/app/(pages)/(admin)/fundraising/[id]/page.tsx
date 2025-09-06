import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Fundraising } from '@/config/types/fundraising';
import Image from 'next/image';
import { notFound } from 'next/navigation';

async function getCampaign(id: string): Promise<Fundraising | null> {
  // Ensure an absolute URL is passed to fetch on the server. If NEXT_PUBLIC_BASE_URL
  // is not set (common in local dev), fall back to localhost so `fetch`/`new URL`
  // won't be given a bare-relative path which throws: "Failed to parse URL from /...".
  const base = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const url = new URL(`/api/v1/fundraising/${id}`, base).toString();
  const res = await fetch(url, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) return notFound();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6 flex items-start gap-6">
        <div className="w-2/3">
          {campaign.images && campaign.images.length > 0 ? (
            <div className="w-full h-96 relative rounded-md overflow-hidden">
              <Image
                src={String(campaign.images[0])}
                alt={campaign.title || 'campaign image'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-96 bg-muted rounded-md flex items-center justify-center">
              No image
            </div>
          )}
        </div>
        <aside className="w-1/3">
          <h1 className="text-2xl font-bold mb-2">{campaign.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Created {new Date(campaign.created_at).toLocaleDateString()}
          </p>
          <div className="mb-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">₱{(campaign.raised_amount || 0).toLocaleString()}</span>
              <span className="text-muted-foreground">
                ₱{(campaign.target_amount || 0).toLocaleString()}
              </span>
            </div>
            <Progress
              value={
                campaign.target_amount
                  ? ((campaign.raised_amount || 0) / campaign.target_amount) * 100
                  : 0
              }
            />
          </div>
          <Badge className="mb-4">{campaign.status}</Badge>
        </aside>
      </div>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">About this campaign</h2>
        <p className="text-sm text-muted-foreground">{campaign.description}</p>
      </section>

      {campaign.images && campaign.images.length > 1 && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Photos</h3>
          <div className="grid grid-cols-4 gap-2">
            {campaign.images.map((src, i) => (
              <div key={i} className="w-full h-28 relative rounded-md overflow-hidden">
                <Image src={String(src)} alt={`image-${i}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
