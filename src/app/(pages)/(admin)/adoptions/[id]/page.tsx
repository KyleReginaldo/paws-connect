'use client';
import { useAuth } from '@/app/context/AuthContext';
import { HappinessImageUpload } from '@/components/HappinessImageUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/components/ui/notification';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Home,
  Mail,
  PawPrint,
  Phone,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PetData {
  id: number;
  name: string;
  type: string;
  breed: string | null;
  photos: string[] | null;
  age: number | null;
  gender: string | null;
  size: string | null;
  weight: string | null;
  description: string | null;
  health_status?: string | null;
  is_vaccinated?: boolean | null;
  is_spayed_or_neutured?: boolean | null;
  rescue_address?: string | null;
}

interface ExtendedPetData extends PetData {
  health_status: string | null;
  is_vaccinated: boolean | null;
  is_spayed_or_neutured: boolean | null;
  rescue_address: string | null;
}

interface AdoptionData {
  id: number;
  user: string | null;
  users: {
    id: string;
    username: string | null;
    email: string | null;
    phone_number: string | null;
    status: string | null;
    created_at: string;
  } | null;
  pet: PetData | null;
  pets: ExtendedPetData | null;
  created_at: string;
  happiness_image: string | null;
  has_children_in_home: boolean | null;
  has_other_pets_in_home: boolean | null;
  have_outdoor_space: boolean | null;
  have_permission_from_landlord: boolean | null;
  is_renting: boolean | null;
  number_of_household_members: number | null;
  type_of_residence: string | null;
  status: string | null;
}

const AdoptionPage = () => {
  const params = useParams();
  const router = useRouter();
  const { success, error: showError } = useNotifications();
  const { userId } = useAuth();
  const id = params.id as string;
  const [adoption, setAdoption] = useState<AdoptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/v1/adoption/${id}`)
        .then((res) => res.json())
        .then((adoptionData) => {
          console.log('Adoption data:', adoptionData.data);
          console.log('Pet data:', adoptionData.data?.pets); // Log pet data specifically
          setAdoption(adoptionData.data);
        })
        .catch((err) => {
          console.error('Error fetching adoption:', err);
          setErrorMessage('Failed to load adoption details');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const getStatusColor = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success-border)]';
      case 'PENDING':
        return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning-border)]';
      case 'REJECTED':
        return 'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error-border)]';
      case 'CANCELLED':
        return 'bg-[var(--color-neutral-bg)] text-[var(--color-neutral)] border-[var(--color-neutral-border)]';
      case 'COMPLETED':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info-border)]';
      default:
        return 'bg-[var(--color-neutral-bg)] text-[var(--color-neutral)] border-[var(--color-neutral-border)]';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = async () => {
    if (!adoption) return;

    setActionLoading('approve');
    try {
      const response = await fetch(`/api/v1/adoption/${adoption.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve adoption');
      }

      // Update the adoption status locally
      setAdoption((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));

      // Show success notification
      success('Adoption Approved', 'The adoption application has been approved successfully.');

      // Redirect to adoptions list after a short delay
      setTimeout(() => {
        router.push('/adoptions');
      }, 2000);
    } catch (err) {
      console.error('Error approving adoption:', err);
      showError('Approval Failed', 'Failed to approve adoption. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!adoption) return;

    // Confirm rejection
    if (
      !confirm(
        'Are you sure you want to reject this adoption application? This action cannot be undone.',
      )
    ) {
      return;
    }

    setActionLoading('reject');
    try {
      const response = await fetch(`/api/v1/adoption/${adoption.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject adoption');
      }

      // Update the adoption status locally
      setAdoption((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));

      // Show success notification
      success('Adoption Rejected', 'The adoption application has been rejected.');

      // Redirect to adoptions list after a short delay
      setTimeout(() => {
        router.push('/adoptions');
      }, 2000);
    } catch (err) {
      console.error('Error rejecting adoption:', err);
      showError('Rejection Failed', 'Failed to reject adoption. Please try again.');
    } finally {
      setActionLoading(null);
    }
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

  if (!adoption) {
    return (
      <div className="container mx-auto px-4 py-6 bg-background min-h-screen">
        <Alert className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">Adoption not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
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

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Adoption Application #{adoption.id}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(adoption.created_at)}</span>
              </div>
            </div>
            <Badge
              className={`flex items-center gap-1 px-2 py-1 text-xs ${getStatusColor(adoption.status)}`}
            >
              {getStatusIcon(adoption.status)}
              {adoption.status || 'Unknown'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PawPrint className="h-4 w-4 text-primary" />
                Pet Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adoption.pets || adoption.pet ? (
                <div className="space-y-4">
                  {(() => {
                    // Use pets if available, otherwise fallback to pet
                    const petData = adoption.pets || adoption.pet;
                    if (!petData) return null;

                    // Type guard to check if petData has extended properties
                    const hasExtendedProps = (
                      data: PetData | ExtendedPetData,
                    ): data is ExtendedPetData => {
                      return 'health_status' in data;
                    };

                    const extendedData = hasExtendedProps(petData) ? petData : null;

                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={
                                (petData.photos && petData.photos.length > 0
                                  ? petData.photos[0]
                                  : null) || '/empty_pet.png'
                              }
                              alt={petData.name || 'Pet'}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <PawPrint className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {petData.name || 'Unknown Pet'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {petData.breed || petData.type || 'Unknown Breed'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          {petData.type && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Type</span>
                              <span className="font-medium">{petData.type}</span>
                            </div>
                          )}
                          {petData.breed && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Breed</span>
                              <span className="font-medium">{petData.breed}</span>
                            </div>
                          )}
                          {petData.age && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Age</span>
                              <span className="font-medium">{petData.age} years old</span>
                            </div>
                          )}
                          {petData.gender && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Gender</span>
                              <span className="font-medium capitalize">
                                {petData.gender.toLowerCase()}
                              </span>
                            </div>
                          )}
                          {petData.size && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Size</span>
                              <span className="font-medium capitalize">
                                {petData.size.toLowerCase()}
                              </span>
                            </div>
                          )}
                          {petData.weight && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Weight</span>
                              <span className="font-medium">{petData.weight}</span>
                            </div>
                          )}
                          {extendedData?.health_status && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Health Status</span>
                              <span className="font-medium">{extendedData.health_status}</span>
                            </div>
                          )}
                          {extendedData?.is_vaccinated !== null &&
                            extendedData?.is_vaccinated !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Vaccinated</span>
                                <span className="font-medium">
                                  {extendedData.is_vaccinated ? 'Yes' : 'No'}
                                </span>
                              </div>
                            )}
                          {extendedData?.is_spayed_or_neutured !== null &&
                            extendedData?.is_spayed_or_neutured !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Spayed/Neutered</span>
                                <span className="font-medium">
                                  {extendedData.is_spayed_or_neutured ? 'Yes' : 'No'}
                                </span>
                              </div>
                            )}
                          {extendedData?.rescue_address && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rescue Location</span>
                              <span
                                className="font-medium text-right max-w-32 truncate"
                                title={extendedData.rescue_address}
                              >
                                {extendedData.rescue_address}
                              </span>
                            </div>
                          )}
                        </div>

                        {petData.description && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {petData.description}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PawPrint className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Pet information not available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The pet data may not be properly linked to this adoption application.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adopter & Application Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4 text-secondary" />
                  Adopter Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adoption.users ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="text-sm font-medium">
                            {adoption.users.username || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium break-all">
                            {adoption.users.email || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">
                            {adoption.users.phone_number || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Member Since</p>
                          <p className="text-sm font-medium">
                            {formatDate(adoption.users.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Adopter information not available</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-4 w-4 text-accent" />
                  Housing Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded border bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Residence</p>
                      <p className="text-sm font-medium capitalize">
                        {adoption.type_of_residence || 'Not specified'}
                      </p>
                    </div>
                    <div className="p-3 rounded border bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Ownership</p>
                      {adoption.is_renting !== null ? (
                        <Badge variant="outline" className="text-xs">
                          {adoption.is_renting ? 'Renting' : 'Owned'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not specified</span>
                      )}
                    </div>
                    <div className="p-3 rounded border bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Household</p>
                      <p className="text-sm font-medium">
                        {adoption.number_of_household_members ?? 'Not specified'}
                        {adoption.number_of_household_members && ' people'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 rounded border text-sm">
                      <span>Outdoor Space</span>
                      <div className="flex items-center gap-1">
                        {adoption.have_outdoor_space ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">Yes</span>
                          </>
                        ) : adoption.have_outdoor_space === false ? (
                          <>
                            <X className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">No</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded border text-sm">
                      <span>Children in Home</span>
                      <div className="flex items-center gap-1">
                        {adoption.has_children_in_home ? (
                          <>
                            <Check className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-600">Yes</span>
                          </>
                        ) : adoption.has_children_in_home === false ? (
                          <>
                            <X className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">No</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded border text-sm">
                      <span>Other Pets</span>
                      <div className="flex items-center gap-1">
                        {adoption.has_other_pets_in_home ? (
                          <>
                            <Check className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-600">Yes</span>
                          </>
                        ) : adoption.has_other_pets_in_home === false ? (
                          <>
                            <X className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">No</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded border text-sm">
                      <span>Landlord Permission</span>
                      <div className="flex items-center gap-1">
                        {adoption.have_permission_from_landlord ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">Yes</span>
                          </>
                        ) : adoption.have_permission_from_landlord === false ? (
                          <>
                            <X className="h-3 w-3 text-red-600" />
                            <span className="text-red-600">No</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {adoption.status === 'PENDING' && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Application Actions</CardTitle>
                  <CardDescription className="text-sm">
                    Review and take action on this application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleApprove}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === 'approve' ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleReject}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === 'reject' ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {(adoption.status === 'APPROVED' || adoption.status === 'REJECTED') && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {adoption.status === 'APPROVED' ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">
                          This application has been approved
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600 font-medium">
                          This application has been rejected
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Happiness Image Upload - Only show for approved adoptions */}
            {adoption.status === 'APPROVED' && (
              <HappinessImageUpload
                adoptionId={adoption.id}
                currentImage={adoption.happiness_image}
                isAdopter={adoption.user === userId}
                adoptionStatus={adoption.status}
                petName={adoption.pets?.name || adoption.pet?.name || 'the pet'}
                onImageUploaded={(imageUrl) => {
                  setAdoption((prev) => (prev ? { ...prev, happiness_image: imageUrl } : null));
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdoptionPage;
