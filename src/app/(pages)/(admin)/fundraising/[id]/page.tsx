'use client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { FundraisingWithDonations } from '@/config/types/fundraising';
import { AlertCircle, ArrowLeft, Calendar, DollarSign, Heart, User, Users } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const FundraisingPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<FundraisingWithDonations | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/v1/fundraising/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setCampaign(data.data);
          } else {
            setErrorMessage('Campaign not found');
          }
        })
        .catch((err) => {
          console.error('Error fetching campaign:', err);
          setErrorMessage('Failed to load campaign details');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container mx-auto px-4 py-6 bg-background min-h-screen">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-6 bg-background min-h-screen">
        <Alert className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">Campaign not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const donations = campaign.donations || [];
  const donationCount = donations.length;
  const averageDonation = donationCount > 0 ? (campaign.raised_amount || 0) / donationCount : 0;
  const progressPercentage = campaign.target_amount
    ? ((campaign.raised_amount || 0) / campaign.target_amount) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 hover:bg-muted h-8"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Campaign Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                {campaign.images && campaign.images.length > 0 ? (
                  <div className="w-full h-96 relative rounded-md overflow-hidden mb-6">
                    <Image
                      src={String(campaign.images[0])}
                      alt={campaign.title || 'campaign image'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-96 bg-muted rounded-md flex items-center justify-center mb-6">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{campaign.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(campaign.created_at)}</span>
                    </div>
                    <Badge className="mb-4">{campaign.status}</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-500">
                        {formatCurrency(campaign.raised_amount || 0)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        of {formatCurrency(campaign.target_amount || 0)} goal
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{progressPercentage.toFixed(1)}% funded</span>
                      <span>{donationCount} donations</span>
                    </div>
                  </div>

                  <section className="pt-6 border-t">
                    <h2 className="text-xl font-semibold mb-3">About this campaign</h2>
                    <p className="text-muted-foreground leading-relaxed">{campaign.description}</p>
                  </section>

                  {campaign.images && campaign.images.length > 1 && (
                    <section className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-3">Photos</h3>
                      <div className="grid grid-cols-4 gap-3">
                        {campaign.images.map((src: string, i: number) => (
                          <div key={i} className="w-full h-28 relative rounded-md overflow-hidden">
                            <Image
                              src={String(src)}
                              alt={`image-${i}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Statistics */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Donation Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded border bg-muted/30">
                      <div className="text-2xl text-blue-500 font-bold">{donationCount}</div>
                      <div className="text-xs text-muted-foreground">Total Donations</div>
                    </div>
                    <div className="text-center p-3 rounded border bg-muted/30">
                      <div className="text-2xl text-green-500 font-bold">
                        {formatCurrency(averageDonation)}
                      </div>
                      <div className="text-xs text-muted-foreground">Average Donation</div>
                    </div>
                  </div>

                  {campaign.created_by_user && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Created by</span>
                      </div>
                      <p className="font-medium">{campaign.created_by_user.username}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Donations List */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-4 w-4 text-red-500" />
                  Recent Donations
                </CardTitle>
                <CardDescription className="text-sm">
                  {donationCount > 0 ? `${donationCount} generous supporters` : 'No donations yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {donations.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {donations.map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-start gap-3 p-3 rounded border bg-muted/20"
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {donation.donor?.username
                              ? donation.donor.username.charAt(0).toUpperCase()
                              : 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">
                              {donation.donor?.username || 'Anonymous'}
                            </span>
                            <span className="font-bold text-sm text-green-500 flex-shrink-0">
                              {formatCurrency(donation.amount)}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(donation.donated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">No donations yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Be the first to support this campaign!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundraisingPage;
