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
    if (!dateOfBirth) return 'Not provided';
    const birthDate = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const md = now.getMonth() - birthDate.getMonth();
    if (md < 0 || (md === 0 && now.getDate() < birthDate.getDate())) age--;
    return `${age} years old`;
  };

  const safe = (v: string | null | undefined, fallback: string) => v ?? fallback;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pet Adoption Application Form</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@600&family=Open+Sans&display=swap');
      body { margin: 0; padding: 0; background: #f4f4f4; font-family: 'Open Sans', sans-serif; }
      .certificate-container { width: 900px; background: #fffaf5; margin: 24px auto; padding: 25px; border: 10px solid #4b9b6a; border-radius: 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); position: relative; background-image: radial-gradient(circle at center, rgba(75,155,106,0.05) 0%, transparent 80%); }
      .inner-border { border: 3px dashed #d4af37; border-radius: 10px; margin: 10px; padding: 28px; box-sizing: border-box; background: rgba(255,255,255,0.96); }
      .header { text-align: center; margin-bottom: 14px; }
      .paw-icon { width: 60px; margin: 6px auto 8px; display: block; border-radius: 100%; }
      .title { font-family: 'Playfair Display', serif; font-size: 30px; color: #2f6546; margin: 2px 0 4px; letter-spacing: .5px; text-transform: uppercase; }
      .subtitle { font-size: 14px; color: #666; margin: 0 0 8px; }
      .meta { text-align:center; font-size: 12px; color:#666; margin-bottom: 14px; }
      .section { margin: 12px 0 16px; }
      .section-title { font-family: 'Playfair Display', serif; font-size: 18px; color: #2f6546; margin: 0 0 8px; }
      .panel { background:#fff; border:2px solid #e5e7eb; border-radius:8px; padding:12px 14px; }
      .grid { display:grid; grid-template-columns: 1fr 1fr; gap:10px 12px; }
      .row { display:flex; align-items:center; gap:8px; margin:6px 0; }
      .label { width: 200px; font-weight:600; color:#334155; font-size: 13px; }
      .value { flex:1; color:#111827; font-size: 13px; }
      .qa { margin: 10px 0; }
      .q { font-weight:600; color:#374151; margin:0 0 6px; font-size: 14px; }
      .a { background:#fff; border:2px solid #e5e7eb; border-radius:8px; padding:10px 12px; min-height:44px; font-size: 13px; }
      .a.filled { border-color:#4b9b6a; background:#f3faf6; color:#065f46; font-weight:500; }
      .sig { display:flex; justify-content:space-between; gap:40px; margin-top:18px; }
      .sig-box { flex:1; text-align:center; }
      .sig-line { border-top:2px solid #333; width: 220px; margin: 22px auto 6px; }
      .sig-label { font-size:12px; color:#666; font-weight:600; }
      @media print { body { background:#fff; } .certificate-container { margin:0; box-shadow:none; page-break-inside: avoid; } @page { margin: 0.5in; size: A4; } }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <div class="inner-border">
        <p class="meta">Generated on ${today}</p>
        <div class="header">
          <img class="paw-icon" src="https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/files/playstore.png" alt="Paw Icon" />
          <h1 class="title">Pet Adoption Application</h1>
          <p class="subtitle">Application #${adoption.id} • ${adoptionDate}</p>
        </div>

        ${petData ? `
        <div class="section">
          <h3 class="section-title">Pet Information</h3>
          <div class="panel grid">
            <div class="row"><div class="label">Name</div><div class="value">${safe(petData.name, 'Pet')}</div></div>
            <div class="row"><div class="label">Type</div><div class="value">${safe(petData.type, 'Animal')}</div></div>
            <div class="row"><div class="label">Breed</div><div class="value">${safe(petData.breed, 'Mixed Breed')}</div></div>
            <div class="row"><div class="label">Gender</div><div class="value">${safe(petData.gender, 'Unknown')}</div></div>
            <div class="row"><div class="label">Age</div><div class="value">${petData.age ? `${petData.age} years old` : 'Age unknown'}</div></div>
            <div class="row"><div class="label">Size</div><div class="value">${safe(petData.size, 'Not specified')}</div></div>
          </div>
        </div>` : ''}

        <div class="section">
          <h3 class="section-title">Adopter Information</h3>
          <div class="panel grid">
            <div class="row"><div class="label">Full name</div><div class="value">${safe(adopterData?.username, 'Not provided')}</div></div>
            <div class="row"><div class="label">Age</div><div class="value">${adopterData?.user_identification?.date_of_birth ? calculateAge(adopterData.user_identification.date_of_birth) : 'Not provided'}</div></div>
            <div class="row"><div class="label">Email</div><div class="value">${safe(adopterData?.email, 'Not provided')}</div></div>
            <div class="row"><div class="label">Phone</div><div class="value">${safe(adopterData?.phone_number, 'Not provided')}</div></div>
            <div class="row" style="grid-column: 1 / -1;"><div class="label">Address</div><div class="value">${safe(adopterData?.user_identification?.address, 'Not provided')}</div></div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Application Questions</h3>
          <div class="qa">
            <p class="q">1) What animal would you like to adopt?</p>
            <div class="a ${petData ? 'filled' : ''}">${petData ? `${petData.name} - ${petData.type} (${petData.breed || 'Mixed breed'})` : 'Please specify the animal you would like to adopt'}</div>
          </div>
          <div class="qa">
            <p class="q">2) What made you decide to adopt an animal?</p>
            <div class="a ${adoption.reason_for_adopting ? 'filled' : ''}">${adoption.reason_for_adopting || 'Please explain your motivation for adopting'}</div>
          </div>
          <div class="qa">
            <p class="q">3) Are you willing to visit the shelter to pick out your new fur-baby?</p>
            <div class="a ${adoption.willing_to_visit_shelter !== null ? 'filled' : ''}">${adoption.willing_to_visit_shelter !== null ? (adoption.willing_to_visit_shelter ? '☑ Yes ☐ No' : '☐ Yes ☑ No') : '☐ Yes ☐ No'}</div>
          </div>
          <div class="qa">
            <p class="q">4) Are you willing to visit us a few more times after that?</p>
            <div class="a ${adoption.willing_to_visit_again !== null ? 'filled' : ''}">${adoption.willing_to_visit_again !== null ? (adoption.willing_to_visit_again ? '☑ Yes ☐ No' : '☐ Yes ☑ No') : '☐ Yes ☐ No'}</div>
          </div>
          <div class="qa">
            <p class="q">5) Are you adopting for yourself or others?</p>
            <div class="a ${adoption.adopting_for_self !== null ? 'filled' : ''}">${adoption.adopting_for_self !== null ? (adoption.adopting_for_self ? 'For myself' : 'For others') : 'Please specify who you are adopting for'}</div>
          </div>
          <div class="qa">
            <p class="q">6) How will you provide a loving FURrever home?</p>
            <div class="a ${adoption.how_can_you_give_fur_rever_home ? 'filled' : ''}">${adoption.how_can_you_give_fur_rever_home || 'Please describe how you will provide a loving forever home'}</div>
          </div>
          <div class="qa">
            <p class="q">7) Where did you hear about us?</p>
            <div class="a ${adoption.where_did_you_hear_about_us ? 'filled' : ''}">${adoption.where_did_you_hear_about_us || 'Please tell us how you found out about our shelter'}</div>
          </div>
        </div>

        <div class="sig">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Applicant Signature</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Date</div>
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