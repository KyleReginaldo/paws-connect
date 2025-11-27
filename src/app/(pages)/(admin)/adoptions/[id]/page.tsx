'use client';
import { useAuth } from '@/app/context/AuthContext';
import { HappinessImageUpload } from '@/components/HappinessImageUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notification';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  FileBadge,
  FileHeart,
  Home,
  Mail,
  PawPrint,
  Phone,
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
    house_images: string[] | null;
    user_identification: {
      id: number;
      id_name: string;
      id_attachment_url: string;
      address: string | null;
      date_of_birth: string | null;
      status: string | null;
      created_at: string;
      first_name: string | null;
      last_name: string | null;
      middle_initial: string | null;
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
  // New fields for adoption form
  reason_for_adopting?: string | null;
  willing_to_visit_shelter?: boolean | null;
  willing_to_visit_again?: boolean | null;
  adopting_for_self?: boolean | null;
  how_can_you_give_fur_rever_home?: string | null;
  where_did_you_hear_about_us?: string | null;
}

const AdoptionPage = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { success, error: showError } = useNotifications();
  const { userId } = useAuth();

  const [adoption, setAdoption] = useState<AdoptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  const isAdopted = (status: string | null) => {
    const s = (status || '').toUpperCase();
    return s === 'APPROVED' || s === 'COMPLETED';
  };

  const buildCertificateHTML = (
    recipientName: string,
    petName: string,
    adopterRealName?: string,
  ) => {
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
      .footer { position: absolute; bottom: 45px; left: 0; width: 100%; display: flex; justify-content: space-evenly; align-items: center; }
      .signature { text-align: center; }
      .signature-line { border-top: 2px solid #333; width: 200px; margin: 0 auto 5px; }
      .signature-name { font-size: 14px; font-weight: 600; color: #333; }
      .adopter-name { font-size: 12px; font-weight: 500; color: #666; margin-bottom: 3px; }
      @media print { 
        body { background: #fff; margin: 0; padding: 0; } 
        .certificate-container { margin: 0; box-shadow: none; page-break-inside: avoid; } 
        @page { margin: 0.5in; size: A4; }
      }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <div class="inner-border">
        <p style="text-align:center;font-size:12px;color:#666;margin:0 0 8px;">Issued on ${today}</p>
        <div class="certificate-header">
          <img class="paw-icon" src="https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/files/playstore.png" alt="Paw Icon" />
          <h1 class="certificate-title">Certificate of Pet Adoption</h1>
          <p class="certificate-subtitle">This certifies that</p>
        </div>
        <p class="recipient-name">${recipientName}</p>
        <p class="adoption-text">has lovingly adopted</p>
        <p class="pet-name">${petName} 🐾</p>
        <p class="pledge">and has pledged to provide unconditional love, care, and a forever home. Thank you for giving ${petName} a second chance at happiness.</p>
        <div class="footer">
          <div class="signature">
            <div class="signature-line"></div>
            <div class="signature-name">Shelter Representative</div>
          </div>
          <div class="signature">
            ${adopterRealName ? `<div class="adopter-name">${adopterRealName}</div>` : ''}
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

  const downloadPDF = async (htmlContent: string, filename: string) => {
    // Create a new window for generating PDF
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('Please allow popups to generate PDF');
      return;
    }

    // Update the HTML to include PDF download functionality
    const htmlWithDownload = htmlContent
      .replace(
        '<script>',
        `<script>
      // Function to trigger PDF download
      function downloadAsPDF() {
        document.title = '${filename}';
        
        // Automatically trigger print dialog which allows saving as PDF
        window.print();
        
        // Optional: Close window after a delay
        setTimeout(() => {
          if (confirm('PDF generated successfully. Close this window?')) {
            window.close();
          }
        }, 1000);
      }
      `,
      )
      .replace(
        'window.onload = function(){ setTimeout(function(){ window.print(); }, 300); }',
        'window.onload = function(){ setTimeout(downloadAsPDF, 500); }',
      );

    printWindow.document.open();
    printWindow.document.write(htmlWithDownload);
    printWindow.document.close();
    printWindow.focus();
  };

  const handleGenerateAdoptionForm = () => {
    if (!adoption) return;

    // Create formatted date for filename
    const today = new Date();
    const dateString =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    const filename = `adoption_form_${dateString}`;

    // Generate the HTML content
    import('@/lib/adoption-form-generator').then(({ generateAdoptionForm }) => {
      const htmlContent = generateAdoptionForm(adoption);
      downloadPDF(htmlContent, filename);
    });
  };

  const handleGenerateCertificate = () => {
    if (!adoption) return;
    const recipient = adoption.users?.username || 'Adopter';
    const petName = adoption.pets?.name || adoption.pet?.name || 'your new friend';

    // Get the adopter's real name from user identification
    const userIdent = adoption.users?.user_identification;
    const adopterRealName =
      userIdent?.first_name && userIdent?.last_name
        ? `${userIdent.first_name} ${userIdent.last_name}`
        : undefined;

    // Create formatted date for filename
    const today = new Date();
    const dateString =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    const filename = `certificate_${dateString}`;

    const html = buildCertificateHTML(recipient, petName, adopterRealName);
    downloadPDF(html, filename);
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
        return 'bg-green-500 text-green-50 border-green-50';
      case 'PENDING':
        return 'bg-yellow-500 text-yellow-50 border-yellow-50';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-red-500 text-red-50 border-red-50';
      case 'COMPLETED':
        return 'bg-blue-500 text-blue-50 border-blue-50';
      default:
        return 'bg-gray-500 text-gray-50 border-gray-50';
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
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(adoption.status)}`}
                >
                  {getStatusIcon(adoption.status)}
                  {adoption.status || 'Unknown'}
                </Badge>

                {/* Adoption Form Button - Available for all statuses */}
                {adoption.status === 'APPROVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white cursor-pointer"
                    onClick={handleGenerateAdoptionForm}
                    title="Generate and save adoption form as PDF"
                  >
                    <FileHeart className="h-3 w-3 mr-1" />
                    Generate Adoption Form
                  </Button>
                )}

                {/* Certificate Button - Only for adopted pets */}
                {isAdopted(adoption.status) && (
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs h-7 bg-orange-500 text-white hover:bg-orange-700 cursor-pointer"
                    onClick={handleGenerateCertificate}
                    title="Generate and save certificate as PDF"
                  >
                    <FileBadge className="h-3 w-3 mr-1" />
                    Generate Certificate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column - Pet and Status Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pet Information */}
            {adoption.status === 'PENDING' && (
              <div className="bg-orange-50 rounded-lg border border-orange-200 shadow-sm">
                <div className="px-4 py-3 border-b border-orange-200">
                  <h3 className="text-base font-semibold text-orange-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Pending Approval
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Review the application and take action
                  </p>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                      onClick={handleApprove}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === 'approve' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Application
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 font-medium"
                      onClick={handleReject}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === 'reject' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-2"></div>
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Application
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white border">
              <div className="px-3 py-2 border-b">
                <h3 className="text-sm font-medium text-gray-900">Pet Information</h3>
              </div>
              <div className="p-4">
                {adoption.pets || adoption.pet ? (
                  <div className="space-y-3">
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
                          {/* Pet Image and Basic Info */}
                          <div className="text-center">
                            <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-gray-200">
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
                                <PawPrint className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {petData.name || 'Unknown Pet'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {petData.breed || petData.type || 'Unknown Breed'}
                            </p>
                          </div>

                          {/* Pet Details */}
                          <div className="space-y-2 text-sm">
                            {petData.type && (
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-gray-600 font-medium">Type</span>
                                <span className="text-gray-900">{petData.type}</span>
                              </div>
                            )}
                            {petData.breed && (
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-gray-600 font-medium">Breed</span>
                                <span className="text-gray-900">{petData.breed}</span>
                              </div>
                            )}
                            {typeof petData.age === 'number' && (
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-gray-600 font-medium">Age</span>
                                <span className="text-gray-900">
                                  {petData.age} year{petData.age === 1 ? '' : 's'} old
                                </span>
                              </div>
                            )}
                            {petData.gender && (
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-gray-600 font-medium">Gender</span>
                                <span className="text-gray-900 capitalize">
                                  {petData.gender.toLowerCase()}
                                </span>
                              </div>
                            )}
                            {petData.size && (
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-gray-600 font-medium">Size</span>
                                <span className="text-gray-900 capitalize">
                                  {petData.size.toLowerCase()}
                                </span>
                              </div>
                            )}
                            {petData.weight && (
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-gray-600 font-medium">Weight</span>
                                <span className="text-gray-900">{petData.weight}</span>
                              </div>
                            )}
                            {extendedData?.health_status && (
                              <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-gray-600 font-medium">Health</span>
                                <span className="text-gray-900">{extendedData.health_status}</span>
                              </div>
                            )}
                            {extendedData?.is_vaccinated !== null &&
                              extendedData?.is_vaccinated !== undefined && (
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                  <span className="text-gray-600 font-medium">Vaccinated</span>
                                  <Badge
                                    className={`text-xs ${
                                      extendedData.is_vaccinated
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : 'bg-red-100 text-red-800 border-red-200'
                                    }`}
                                  >
                                    {extendedData.is_vaccinated ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                              )}
                            {extendedData?.is_spayed_or_neutured !== null &&
                              extendedData?.is_spayed_or_neutured !== undefined && (
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                  <span className="text-gray-600 font-medium">Spayed/Neutered</span>
                                  <Badge
                                    className={`text-xs ${
                                      extendedData.is_spayed_or_neutured
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : 'bg-red-100 text-red-800 border-red-200'
                                    }`}
                                  >
                                    {extendedData.is_spayed_or_neutured ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                              )}
                          </div>

                          {petData.description && (
                            <div className="pt-3 mt-3 border-t border-gray-100">
                              <p className="text-sm text-gray-700 leading-relaxed">
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
                    <PawPrint className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Pet information not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Adopter Details */}
          <div className="lg:col-span-3 space-y-4">
            {/* Adopter Information */}
            <div className="bg-white border">
              <div className="px-3 py-2 border-b">
                <h3 className="text-sm font-medium text-gray-900">Adopter Information</h3>
              </div>
              <div className="p-4">
                {adoption.users ? (
                  <div className="space-y-4">
                    {/* Basic Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Full Name</span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium pl-6">
                          {adoption.users.user_identification?.first_name &&
                          adoption.users.user_identification?.last_name
                            ? `${adoption.users.user_identification.first_name} ${adoption.users.user_identification.middle_initial ? adoption.users.user_identification.middle_initial + ' ' : ''}${adoption.users.user_identification.last_name}`
                            : adoption.users.username || 'Not provided'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Username</span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium pl-6">
                          {adoption.users.username || 'Not provided'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Email</span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium pl-6 break-all">
                          {adoption.users.email || 'Not provided'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Phone</span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium pl-6">
                          {adoption.users.phone_number || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    {/* Address Information */}
                    {adoption.users?.user_identification?.address && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Address</span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium pl-6">
                          {adoption.users.user_identification.address}
                        </p>
                      </div>
                    )}

                    {/* ID Verification */}
                    {adoption.users?.user_identification && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            Identity Verification
                          </h4>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Document Type</p>
                            <p className="text-sm font-medium text-gray-900">
                              {adoption.users.user_identification.id_name}
                            </p>
                          </div>
                          {adoption.users.user_identification.address && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Address</p>
                              <p className="text-sm font-medium text-gray-900">
                                {adoption.users.user_identification.address}
                              </p>
                            </div>
                          )}
                          {adoption.users.user_identification.date_of_birth && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                              <p className="text-sm font-medium text-gray-900">
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

                        {adoption.users.user_identification.id_attachment_url && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-500 mb-2">ID Document</p>
                            <div className="relative group inline-block">
                              <Image
                                src={adoption.users.user_identification.id_attachment_url}
                                alt={`${adoption.users.user_identification.id_attachment_url.replaceAll('10.0.2.2', '127.0.0.1')} - Valid ID`}
                                width={200}
                                height={120}
                                className="rounded border border-gray-300 object-cover cursor-pointer hover:border-blue-400 transition-colors"
                                onClick={() =>
                                  window.open(
                                    adoption.users!.user_identification!.id_attachment_url,
                                    '_blank',
                                  )
                                }
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-white px-2 py-1 rounded text-xs text-gray-700 shadow">
                                  Click to enlarge
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Adopter information not available
                  </p>
                )}
              </div>
            </div>

            {/* House Images */}
            <div className="bg-white border">
              <div className="px-3 py-2 border-b">
                <h3 className="text-sm font-medium text-gray-900">House Images</h3>
              </div>
              <div className="p-4">
                {adoption.users?.house_images && adoption.users.house_images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {adoption.users.house_images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative group bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:border-purple-300 transition-colors"
                        >
                          <div className="aspect-square relative cursor-pointer">
                            <Image
                              src={imageUrl}
                              alt={`House image ${index + 1}`}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded text-xs text-gray-700 font-medium">
                                View Full Size
                              </div>
                            </div>
                          </div>
                          <div className="p-2 bg-white">
                            <p className="text-xs text-gray-600 font-medium text-center">
                              Image {index + 1}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Check className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">
                          {adoption.users.house_images.length} house image
                          {adoption.users.house_images.length === 1 ? '' : 's'}
                        </span>{' '}
                        provided for verification
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                      <Home className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-base font-medium text-gray-900 mb-2">No House Images</p>
                    <p className="text-sm text-gray-600 mb-4">
                      The adopter has not provided any house images for verification.
                    </p>
                    <div className="inline-flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <p className="text-sm text-orange-800">
                        <span className="font-semibold">Review required:</span> Consider requesting
                        house images before approval
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border">
              <div className="px-3 py-2 border-b">
                <h3 className="text-sm font-medium text-gray-900">Housing Information</h3>
              </div>
              <div className="p-3">
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
              </div>
            </div>

            {/* Adoption Form Responses */}
            <div className="bg-white border">
              <div className="px-3 py-2 border-b">
                <h3 className="text-sm font-medium text-gray-900">Adoption Form Responses</h3>
              </div>
              <div className="p-3 space-y-4">
                {/* Reason for adopting */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    What made you decide to adopt an animal?
                  </h4>
                  <p className="text-sm text-gray-600">
                    {adoption.reason_for_adopting || 'No response provided'}
                  </p>
                </div>

                {/* Visit shelter questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Willing to visit shelter?
                    </h4>
                    <p className="text-sm text-gray-600">
                      {adoption.willing_to_visit_shelter === true
                        ? 'Yes'
                        : adoption.willing_to_visit_shelter === false
                          ? 'No'
                          : 'No response'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Willing to visit multiple times?
                    </h4>
                    <p className="text-sm text-gray-600">
                      {adoption.willing_to_visit_again === true
                        ? 'Yes'
                        : adoption.willing_to_visit_again === false
                          ? 'No'
                          : 'No response'}
                    </p>
                  </div>
                </div>

                {/* Adopting for self */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Are you adopting for yourself or others?
                  </h4>
                  <p className="text-sm text-gray-600">
                    {adoption.adopting_for_self === true
                      ? 'For myself'
                      : adoption.adopting_for_self === false
                        ? 'For others'
                        : 'No response'}
                  </p>
                </div>

                {/* Forever home description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    How will you provide a loving FURrever home?
                  </h4>
                  <p className="text-sm text-gray-600">
                    {adoption.how_can_you_give_fur_rever_home || 'No response provided'}
                  </p>
                </div>

                {/* Where did you hear about us */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Where did you hear about us?
                  </h4>
                  <p className="text-sm text-gray-600">
                    {adoption.where_did_you_hear_about_us || 'No response provided'}
                  </p>
                </div>
              </div>
            </div>
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
