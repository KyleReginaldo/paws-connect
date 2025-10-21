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
  Printer,
  User,
  X,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
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
    user_identification: {
      id: number;
      id_name: string;
      id_attachment_url: string;
      address: string | null;
      date_of_birth: string | null;
      status: string | null;
      created_at: string;
    } | null;
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

  const isAdopted = (status: string | null) => {
    const s = (status || '').toUpperCase();
    return s === 'APPROVED' || s === 'COMPLETED';
  };

  const buildCertificateHTML = (recipientName: string, petName: string) => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certificate of Pet Adoption</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@600&family=Open+Sans&display=swap');
      body { margin: 0; padding: 0; background: #f4f4f4; font-family: 'Open Sans', sans-serif; }
      .certificate-container { width: 900px; height: 650px; background: #fffaf5; margin: 50px auto; padding: 25px; border: 10px solid #4b9b6a; border-radius: 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; background-image: radial-gradient(circle at center, rgba(75,155,106,0.05) 0%, transparent 80%); }
      .inner-border { border: 3px dashed #d4af37; border-radius: 10px; height: calc(100% - 50px); width: calc(100% - 50px); margin: 25px auto; padding: 40px; box-sizing: border-box; position: relative; background: rgba(255,255,255,0.95); }
      .certificate-header { text-align: center; }
      .paw-icon { width: 65px; margin: 10px auto; display: block; border-radius: 100%; }
      .certificate-title { font-family: 'Playfair Display', serif; font-size: 38px; color: #2f6546; margin-top: 10px; letter-spacing: 1px; text-transform: uppercase; }
      .certificate-subtitle { font-size: 18px; color: #555; margin-bottom: 35px; }
      .recipient-name { font-family: 'Great Vibes', cursive; font-size: 40px; color: #222; text-align: center; margin: 0; }
      .adoption-text { text-align: center; margin-top: 15px; font-size: 18px; color: #444; }
      .pet-name { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 600; color: #4b9b6a; text-align: center; margin-top: 5px; }
      .pledge { margin: 25px auto 20px; text-align: center; font-size: 16px; color: #555; max-width: 600px; line-height: 1.6; }
      .date { text-align: center; font-size: 15px; color: #666; margin-bottom: 40px; }
      .footer { position: absolute; bottom: 45px; left: 0; width: 100%; display: flex; justify-content: space-evenly; align-items: center; }
      .signature { text-align: center; }
      .signature-line { border-top: 2px solid #333; width: 200px; margin: 0 auto 5px; }
      .signature-name { font-size: 14px; font-weight: 600; color: #333; }
      @media print { body { background: #fff; } .certificate-container { margin: 0; box-shadow: none; } }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <div class="inner-border">
        <div class="certificate-header">
          <img class="paw-icon" src="https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/files/playstore.png" alt="Paw Icon" />
          <h1 class="certificate-title">Certificate of Pet Adoption</h1>
          <p class="certificate-subtitle">This certifies that</p>
        </div>
        <p class="recipient-name">${recipientName}</p>
        <p class="adoption-text">has lovingly adopted</p>
        <p class="pet-name">${petName} 🐾</p>
        <p class="pledge">and has pledged to provide unconditional love, care, and a forever home. Thank you for giving ${petName} a second chance at happiness.</p>
        <p class="date">Issued on ${today}</p>
        <div class="footer">
          <div class="signature">
            <div class="signature-line"></div>
            <div class="signature-name">Shelter Representative</div>
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            <div class="signature-name">Adopter’s Signature</div>
          </div>
        </div>
      </div>
    </div>
    <script>
      window.onload = function(){ setTimeout(function(){ window.print(); }, 300); }
    </script>
  </body>
</html>`;
  };

  const handleGenerateCertificate = () => {
    if (!adoption) return;
    const recipient = adoption.users?.username || 'Adopter';
    const petName = adoption.pets?.name || adoption.pet?.name || 'your new friend';
    const html = buildCertificateHTML(recipient, petName);
    const w = window.open('', '_blank', 'width=1000,height=800');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  };

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 py-3 max-w-6xl">
        <div className="mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-2 hover:bg-gray-100 h-7 px-2 text-xs"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Adoptions
          </Button>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
              <div>
                <h1 className="text-lg font-semibold mb-0.5 text-gray-900">
                  Application #{adoption.id}
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(adoption.created_at)}</span>
                  </div>
                  <div className="h-3 w-px bg-gray-300"></div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{adoption.users?.username || 'Unknown User'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(adoption.status)}`}
                >
                  {getStatusIcon(adoption.status)}
                  {adoption.status || 'Unknown'}
                </Badge>
                {isAdopted(adoption.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleGenerateCertificate}
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    Generate Certificate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="lg:col-span-1 bg-white border border-gray-200">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <PawPrint className="h-4 w-4 text-gray-600" />
                Pet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {adoption.pets || adoption.pet ? (
                <div className="space-y-2">
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
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                (petData.photos && petData.photos.length > 0
                                  ? petData.photos[0]
                                  : null) || '/empty_pet.png'
                              }
                              alt={petData.name || 'Pet'}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gray-100 text-gray-600">
                              <PawPrint className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">
                              {petData.name || 'Unknown Pet'}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {petData.breed || petData.type || 'Unknown Breed'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          {petData.type && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type</span>
                              <span className="font-medium text-gray-900">{petData.type}</span>
                            </div>
                          )}
                          {petData.breed && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Breed</span>
                              <span className="font-medium text-gray-900">{petData.breed}</span>
                            </div>
                          )}
                          {typeof petData.age === 'number' && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Age</span>
                              <span className="font-medium text-gray-900">
                                {petData.age} year{petData.age === 1 ? '' : 's'} old
                              </span>
                            </div>
                          )}
                          {petData.gender && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gender</span>
                              <span className="font-medium text-gray-900 capitalize">
                                {petData.gender.toLowerCase()}
                              </span>
                            </div>
                          )}
                          {petData.size && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Size</span>
                              <span className="font-medium text-gray-900 capitalize">
                                {petData.size.toLowerCase()}
                              </span>
                            </div>
                          )}
                          {petData.weight && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Weight</span>
                              <span className="font-medium text-gray-900">{petData.weight}</span>
                            </div>
                          )}
                          {extendedData?.health_status && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Health Status</span>
                              <span className="font-medium text-gray-900">
                                {extendedData.health_status}
                              </span>
                            </div>
                          )}
                          {extendedData?.is_vaccinated !== null &&
                            extendedData?.is_vaccinated !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Vaccinated</span>
                                <span className="font-medium text-gray-900">
                                  {extendedData.is_vaccinated ? 'Yes' : 'No'}
                                </span>
                              </div>
                            )}
                          {extendedData?.is_spayed_or_neutured !== null &&
                            extendedData?.is_spayed_or_neutured !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Spayed/Neutered</span>
                                <span className="font-medium text-gray-900">
                                  {extendedData.is_spayed_or_neutured ? 'Yes' : 'No'}
                                </span>
                              </div>
                            )}
                          {extendedData?.rescue_address && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rescue Location</span>
                              <span
                                className="font-medium text-gray-900 text-right max-w-32 truncate"
                                title={extendedData.rescue_address}
                              >
                                {extendedData.rescue_address}
                              </span>
                            </div>
                          )}
                        </div>

                        {petData.description && (
                          <div className="pt-1 border-t border-gray-100">
                            <p className="text-xs text-gray-600 leading-relaxed">
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
          <div className="lg:col-span-2 space-y-3">
            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <User className="h-4 w-4 text-gray-600" />
                  Adopter Information
                </CardTitle>
              </CardHeader>
              <CardContent className="">
                {adoption.users ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <User className="h-3 w-3 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-xs font-medium text-gray-900">
                            {adoption.users.username || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Mail className="h-3 w-3 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-xs font-medium text-gray-900 break-all">
                            {adoption.users.email || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <Phone className="h-3 w-3 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-xs font-medium text-gray-900">
                            {adoption.users.phone_number || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-3 w-3 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Member Since</p>
                          <p className="text-xs font-medium text-gray-900">
                            {formatDate(adoption.users.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {adoption.users?.user_identification && (
                      <div className="col-span-full mt-2">
                        <div className="p-2 rounded-lg border border-gray-200 bg-gray-50">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-4 w-4 rounded bg-blue-100 flex items-center justify-center">
                              <User className="h-3 w-3 text-blue-600" />
                            </div>
                            <p className="text-xs font-medium text-gray-900">User Identification</p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center p-1.5 rounded bg-white border border-gray-200">
                              <div>
                                <p className="text-xs text-gray-500">Document Name</p>
                                <span className="text-xs font-medium text-gray-900">
                                  {adoption.users.user_identification.id_name}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  adoption.users.user_identification.status === 'ACCEPTED'
                                    ? 'default'
                                    : adoption.users.user_identification.status === 'PENDING'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                                className="text-xs"
                              >
                                {adoption.users.user_identification.status || 'Pending'}
                              </Badge>
                            </div>
                            {adoption.users.user_identification.id_attachment_url && (
                              <div className="relative bg-white rounded p-1.5 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-0.5">ID Document</p>
                                <div className="relative group">
                                  <Image
                                    src={adoption.users.user_identification.id_attachment_url}
                                    alt={`${adoption.users.user_identification.id_name} - Valid ID`}
                                    width={300}
                                    height={180}
                                    className="w-full max-w-xs h-auto rounded border border-gray-200 object-cover cursor-pointer hover:border-blue-300 transition-colors"
                                    onClick={() =>
                                      window.open(
                                        adoption.users!.user_identification!.id_attachment_url,
                                        '_blank',
                                      )
                                    }
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="bg-white px-2 py-1 rounded text-xs text-gray-700">
                                      Click to enlarge
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                              {adoption.users.user_identification.address && (
                                <div className="p-1.5 rounded bg-white border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-0.5">Address</p>
                                  <p className="text-xs text-gray-900 font-medium">
                                    {adoption.users.user_identification.address}
                                  </p>
                                </div>
                              )}
                              {adoption.users.user_identification.date_of_birth && (
                                <div className="p-1.5 rounded bg-white border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-0.5">Date of Birth</p>
                                  <p className="text-xs text-gray-900 font-medium">
                                    {new Date(
                                      adoption.users.user_identification.date_of_birth,
                                    ).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                              <span className="font-medium">Submitted:</span>{' '}
                              {new Date(
                                adoption.users.user_identification.created_at,
                              ).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Adopter information not available</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Home className="h-4 w-4 text-gray-600" />
                  Housing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    <div className="p-1.5 rounded border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Home className="h-3 w-3 text-gray-500" />
                        <p className="text-xs text-gray-600 font-medium">Residence</p>
                      </div>
                      <p className="text-xs font-medium capitalize text-gray-900">
                        {adoption.type_of_residence || 'Not specified'}
                      </p>
                    </div>
                    <div className="p-1.5 rounded border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Home className="h-3 w-3 text-gray-500" />
                        <p className="text-xs text-gray-600 font-medium">Ownership</p>
                      </div>
                      {adoption.is_renting !== null ? (
                        <Badge
                          variant={adoption.is_renting ? 'secondary' : 'default'}
                          className="text-xs h-4 px-2"
                        >
                          {adoption.is_renting ? 'Renting' : 'Owned'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-600">Not specified</span>
                      )}
                    </div>
                    <div className="p-1.5 rounded border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-1 mb-0.5">
                        <User className="h-3 w-3 text-gray-500" />
                        <p className="text-xs text-gray-600 font-medium">Household</p>
                      </div>
                      <p className="text-xs font-medium text-gray-900">
                        {adoption.number_of_household_members ?? 'Not specified'}
                        {adoption.number_of_household_members && ' people'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    <div className="flex items-center justify-between p-1.5 rounded border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center ${
                            adoption.have_outdoor_space
                              ? 'bg-green-100'
                              : adoption.have_outdoor_space === false
                                ? 'bg-gray-100'
                                : 'bg-gray-100'
                          }`}
                        >
                          <Home
                            className={`h-3 w-3 ${
                              adoption.have_outdoor_space ? 'text-green-600' : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900">Outdoor Space</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {adoption.have_outdoor_space ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs h-4 px-2">
                              Yes
                            </Badge>
                          </>
                        ) : adoption.have_outdoor_space === false ? (
                          <>
                            <X className="h-3 w-3 text-gray-500" />
                            <Badge variant="secondary" className="text-xs h-4 px-2">
                              No
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs h-4 px-2">
                            Unknown
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center ${
                            adoption.has_children_in_home
                              ? 'bg-blue-100'
                              : adoption.has_children_in_home === false
                                ? 'bg-gray-100'
                                : 'bg-gray-100'
                          }`}
                        >
                          <User
                            className={`h-3 w-3 ${
                              adoption.has_children_in_home ? 'text-blue-600' : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900">Children in Home</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {adoption.has_children_in_home ? (
                          <>
                            <Check className="h-3 w-3 text-blue-600" />
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs h-4 px-2">
                              Yes
                            </Badge>
                          </>
                        ) : adoption.has_children_in_home === false ? (
                          <>
                            <X className="h-3 w-3 text-gray-500" />
                            <Badge variant="secondary" className="text-xs h-4 px-2">
                              No
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs h-4 px-2">
                            Unknown
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center ${
                            adoption.has_other_pets_in_home
                              ? 'bg-purple-100'
                              : adoption.has_other_pets_in_home === false
                                ? 'bg-gray-100'
                                : 'bg-gray-100'
                          }`}
                        >
                          <PawPrint
                            className={`h-3 w-3 ${
                              adoption.has_other_pets_in_home ? 'text-purple-600' : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900">Other Pets</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {adoption.has_other_pets_in_home ? (
                          <>
                            <Check className="h-3 w-3 text-purple-600" />
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs h-4 px-2">
                              Yes
                            </Badge>
                          </>
                        ) : adoption.has_other_pets_in_home === false ? (
                          <>
                            <X className="h-3 w-3 text-gray-500" />
                            <Badge variant="secondary" className="text-xs h-4 px-2">
                              No
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs h-4 px-2">
                            Unknown
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center ${
                            adoption.have_permission_from_landlord
                              ? 'bg-green-100'
                              : adoption.have_permission_from_landlord === false
                                ? 'bg-red-100'
                                : 'bg-gray-100'
                          }`}
                        >
                          <CheckCircle
                            className={`h-3 w-3 ${
                              adoption.have_permission_from_landlord
                                ? 'text-green-600'
                                : adoption.have_permission_from_landlord === false
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          Landlord Permission
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {adoption.have_permission_from_landlord ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs h-4 px-2">
                              Yes
                            </Badge>
                          </>
                        ) : adoption.have_permission_from_landlord === false ? (
                          <>
                            <X className="h-3 w-3 text-red-600" />
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs h-4 px-2">
                              No
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs h-4 px-2">
                            Unknown
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {adoption.status === 'PENDING' && (
              <Card className="bg-white border border-orange-200 border-l-4 border-l-orange-400">
                <CardHeader className="pb-2 bg-orange-50">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-orange-100 flex items-center justify-center">
                      <Clock className="h-3 w-3 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-gray-900">
                        Application Actions
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-600">
                        Review and take action on this application
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 h-8"
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
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 text-xs px-4 h-8"
                      onClick={handleReject}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === 'reject' ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700 mr-1"></div>
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
