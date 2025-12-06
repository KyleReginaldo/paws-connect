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

interface AdoptionFormData {
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
export const generateAdoptionForm = (adoption: AdoptionFormData): string => {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const adoptionDate = new Date(adoption.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const petData = adoption.pets || adoption.pet;
  const adopterData = adoption.users;

  const calculateAge = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const md = now.getMonth() - birthDate.getMonth();
    if (md < 0 || (md === 0 && now.getDate() < birthDate.getDate())) age--;
    return `${age}`;
  };

  const safe = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    // Ensure arrays/objects are stringified meaningfully
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'object') return String(v as object);
    return String(v);
  };

  return `
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Adoption Form</title>

<style>
  body {
    font-family: Arial, sans-serif;
    padding: 32px;
    background: #ffffff;
    color: #000;
    line-height: 1.4;
  }

  h1, h2 {
    font-weight: bold;
    margin-bottom: 8px;
    margin-top: 22px;
  }

  .header {
    text-align: center;
    margin-bottom: 24px;
  }

  .line {
    border-bottom: 1px solid #000;
    width: 100%;
    height: 16px;
  }

  .row {
    display: flex;
    align-items: center;
    margin: 6px 0;
    gap: 10px;
  }

  .label {
    width: 180px;
    font-size: 14px;
    font-weight: bold;
  }

  textarea.answer {
    width: 100%;
    min-height: 55px;
    border: 1px solid #000;
    padding: 8px;
    font-size: 14px;
    margin-top: 4px;
  }

  .checkbox-group {
    display: flex;
    gap: 24px;
    margin: 6px 0 12px;
  }

  .signature-section {
    margin-top: 48px;
    display: flex;
    justify-content: space-between;
  }

  .sig-box {
    width: 45%;
    text-align: center;
  }

  .sig-line {
    border-bottom: 1px solid #000;
    margin: 40px 0 6px;
    height: 0;
  }

  @media print {
    body {
      background: #fff;
    }
  }
</style>
</head>

<body>

<div class="header">
  <h1>ADOPTION APPLICATION FORM</h1>
  <p>Date: ${today}</p>
  <p>Application #${adoption.id} • Submitted on ${adoptionDate}</p>
</div>


<!-- APPLICANT INFORMATION -->
<h2>Applicant Information</h2>

<div class="row">
  <div class="label">Full Name:</div>
  <div class="line">${safe(adopterData?.username)}</div>
</div>

<div class="row">
  <div class="label">Age:</div>
  <div class="line">${adopterData?.user_identification?.date_of_birth ? `${calculateAge(adopterData.user_identification.date_of_birth)} years old` : 'Not provided'}</div>
</div>

<div class="row">
  <div class="label">Date of Birth:</div>
  <div class="line">${adopterData?.user_identification?.date_of_birth ? new Date(adopterData.user_identification.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}</div>
</div>

<div class="row">
  <div class="label">Email:</div>
  <div class="line">${safe(adopterData?.email)}</div>
</div>

<div class="row">
  <div class="label">Phone:</div>
  <div class="line">${safe(adopterData?.phone_number)}</div>
</div>

<div class="row">
  <div class="label">Address:</div>
  <div class="line">${safe(adopterData?.user_identification?.address)}</div>
</div>


<!-- PET INFORMATION -->
<h2>Pet Information</h2>

<div class="row"><div class="label">Pet Name:</div><div class="line">${safe(petData?.name)}</div></div>
<div class="row"><div class="label">Type:</div><div class="line">${safe(petData?.type)}</div></div>
<div class="row"><div class="label">Breed:</div><div class="line">${safe(petData?.breed)}</div></div>
<div class="row"><div class="label">Gender:</div><div class="line">${safe(petData?.gender)}</div></div>
<div class="row"><div class="label">Age:</div><div class="line">${petData?.age ? petData.age : ''}</div></div>
<div class="row"><div class="label">Size:</div><div class="line">${safe(petData?.size)}</div></div>


<!-- QUESTIONNAIRE -->
<h2>Questionnaire</h2>

<p><strong>1) Why did you decide to adopt an animal?</strong></p>
<textarea class="answer">${safe(adoption.reason_for_adopting)}</textarea>

<p><strong>2) Are you willing to visit the shelter?</strong></p>
<div class="checkbox-group">
  <div>${adoption.willing_to_visit_shelter ? '☑ Yes' : '☐ Yes'}</div>
  <div>${adoption.willing_to_visit_shelter === false ? '☑ No' : '☐ No'}</div>
</div>

<p><strong>3) Are you willing to visit again?</strong></p>
<div class="checkbox-group">
  <div>${adoption.willing_to_visit_again ? '☑ Yes' : '☐ Yes'}</div>
  <div>${adoption.willing_to_visit_again === false ? '☑ No' : '☐ No'}</div>
</div>

<p><strong>4) Are you adopting for yourself or someone else?</strong></p>
<textarea class="answer">${adoption.adopting_for_self !== null ? (adoption.adopting_for_self ? 'For myself' : 'For others') : ''}</textarea>

<p><strong>5) How will you provide a loving FURrever home?</strong></p>
<textarea class="answer">${safe(adoption.how_can_you_give_fur_rever_home)}</textarea>

<p><strong>6) Where did you hear about us?</strong></p>
<textarea class="answer">${safe(adoption.where_did_you_hear_about_us)}</textarea>


<!-- SIGNATURES -->
<div class="signature-section">
  <div class="sig-box">
    <div class="sig-line"></div>
    Applicant Signature
  </div>

  <div class="sig-box">
    <div class="sig-line"></div>
    Date
  </div>
</div>

<script>
  window.onload = () => setTimeout(() => window.print(), 300);
</script>

</body>
</html>
`;
};


export const generateAndPrintAdoptionForm = (adoption: AdoptionFormData): void => {
  // Create formatted date for filename
  const today = new Date();
  const dateString = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
  const filename = `adoption_form_${dateString}`;
  
  const html = generateAdoptionForm(adoption);
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  
  if (!printWindow) {
    alert('Please allow popups to generate the adoption form');
    return;
  }
  
  // Set the document title to the desired filename
  const htmlWithTitle = html.replace(
    '<title>Pet Adoption Application Form</title>',
    `<title>${filename}</title>`
  );
  
  printWindow.document.open();
  printWindow.document.write(htmlWithTitle);
  printWindow.document.close();
  printWindow.focus();
};