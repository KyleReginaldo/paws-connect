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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return 'Not provided';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years old`;
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pet Adoption Application Form</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * { box-sizing: border-box; }
      body { 
        margin: 0; 
        padding: 20px; 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
        line-height: 1.6; 
        color: #1f2937;
        background: #f9fafb;
        font-size: 14px;
      }
      
      .form-container { 
        max-width: 700px; 
        margin: 0 auto; 
        background: white; 
        padding: 40px; 
        border-radius: 8px; 
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
      }
      
      .header { 
        text-align: center; 
        margin-bottom: 40px; 
        border-bottom: 2px solid #059669;
        padding-bottom: 20px;
      }
      
      .logo { 
        font-size: 32px; 
        margin-bottom: 10px;
      }
      
      .form-title { 
        font-size: 24px; 
        font-weight: 700; 
        color: #111827; 
        margin: 0 0 5px 0;
      }
      
      .form-subtitle { 
        font-size: 14px; 
        color: #6b7280; 
        margin: 0;
      }
      
      .application-id {
        display: inline-block;
        background: #f3f4f6;
        color: #374151;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 8px;
      }
      
      .question { 
        margin-bottom: 25px;
        page-break-inside: avoid;
      }
      
      .question-number {
        display: inline-block;
        width: 25px;
        height: 25px;
        background: #059669;
        color: white;
        border-radius: 50%;
        text-align: center;
        line-height: 25px;
        font-size: 12px;
        font-weight: 600;
        margin-right: 12px;
        flex-shrink: 0;
      }
      
      .question-header {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      
      .question-text { 
        font-weight: 600; 
        color: #374151; 
        margin: 0;
        flex: 1;
        font-size: 15px;
        line-height: 1.4;
      }
      
      .answer-box { 
        background: #f9fafb;
        border: 2px solid #d1d5db;
        border-radius: 6px;
        min-height: 50px;
        padding: 12px;
        margin-left: 37px;
        font-size: 14px;
        color: #111827;
        position: relative;
      }
      
      .answer-box.filled {
        background: #ecfdf5;
        border-color: #059669;
        color: #047857;
        font-weight: 500;
      }
      
      .answer-box.short {
        min-height: 40px;
      }
      
      .answer-box.tall {
        min-height: 80px;
      }
      
      .answer-placeholder {
        color: #9ca3af;
        font-style: italic;
        font-size: 13px;
      }
      
      .pet-info {
        background: #f0f9ff;
        border: 2px solid #0ea5e9;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
      }
      
      .pet-name {
        font-size: 20px;
        font-weight: 700;
        color: #0c4a6e;
        margin-bottom: 8px;
      }
      
      .pet-details {
        font-size: 14px;
        color: #075985;
        line-height: 1.5;
      }
      
      .footer {
        margin-top: 40px;
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        font-size: 11px;
        color: #6b7280;
      }
      
      .signature-section {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
        gap: 40px;
      }
      
      .signature-box {
        flex: 1;
        text-align: center;
      }
      
      .signature-line {
        border-top: 2px solid #374151;
        margin-bottom: 8px;
        width: 150px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .signature-label {
        font-size: 11px;
        color: #6b7280;
        font-weight: 500;
      }
      
      @media print { 
        body { 
          background: white; 
          padding: 0;
        } 
        .form-container { 
          box-shadow: none; 
          border: none;
          padding: 20px;
        }
        .question {
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="form-container">
      <div class="header">
        <div class="logo">🐾</div>
        <h1 class="form-title">Pet Adoption Application</h1>
        <p class="form-subtitle">Please complete all questions below</p>
        <div class="application-id">Application #${adoption.id} • ${adoptionDate}</div>
      </div>

      ${petData ? `
        <div class="pet-info">
          <div class="pet-name">${petData.name || 'Pet'}</div>
          <div class="pet-details">
            ${petData.type || 'Animal'} • ${petData.breed || 'Mixed Breed'} • ${petData.gender || 'Unknown'}<br>
            ${petData.age ? `${petData.age} years old` : 'Age unknown'} • ${petData.size || 'Size not specified'}
          </div>
        </div>
      ` : ''}

      <!-- Question 1: Full name of adopter -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">1</div>
          <p class="question-text">Full name of adopter</p>
        </div>
        <div class="answer-box short ${adopterData?.username ? 'filled' : ''}">
          ${adopterData?.username || '<span class="answer-placeholder">Please write your full name</span>'}
        </div>
      </div>

      <!-- Question 2: Age -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">2</div>
          <p class="question-text">Age</p>
        </div>
        <div class="answer-box short ${adopterData?.user_identification?.date_of_birth ? 'filled' : ''}">
          ${adopterData?.user_identification?.date_of_birth 
            ? calculateAge(adopterData.user_identification.date_of_birth)
            : '<span class="answer-placeholder">Please write your age</span>'}
        </div>
      </div>

      <!-- Question 3: Email address -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">3</div>
          <p class="question-text">Email address</p>
        </div>
        <div class="answer-box short ${adopterData?.email ? 'filled' : ''}">
          ${adopterData?.email || '<span class="answer-placeholder">Please write your email address</span>'}
        </div>
      </div>

      <!-- Question 4: Contact number -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">4</div>
          <p class="question-text">Contact number</p>
        </div>
        <div class="answer-box short ${adopterData?.phone_number ? 'filled' : ''}">
          ${adopterData?.phone_number || '<span class="answer-placeholder">Please write your phone number</span>'}
        </div>
      </div>

      <!-- Question 5: Address -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">5</div>
          <p class="question-text">Address</p>
        </div>
        <div class="answer-box ${adopterData?.user_identification?.address ? 'filled' : ''}">
          ${adopterData?.user_identification?.address || '<span class="answer-placeholder">Please write your complete address</span>'}
        </div>
      </div>

      <!-- Question 6: What animal would you like to adopt? -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">6</div>
          <p class="question-text">What animal would you like to adopt?</p>
        </div>
        <div class="answer-box ${petData ? 'filled' : ''}">
          ${petData ? `${petData.name} - ${petData.type} (${petData.breed || 'Mixed breed'})` 
            : '<span class="answer-placeholder">Please specify the animal you would like to adopt</span>'}
        </div>
      </div>

      <!-- Question 7: What made you decide to adopt an animal? -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">7</div>
          <p class="question-text">What made you decide to adopt an animal?</p>
        </div>
        <div class="answer-box tall ${adoption.reason_for_adopting ? 'filled' : ''}">
          ${adoption.reason_for_adopting || '<span class="answer-placeholder">Please explain your motivation for adopting</span>'}
        </div>
      </div>

      <!-- Question 8: Are you willing to visit the shelter to pick out your new fur-baby? -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">8</div>
          <p class="question-text">Are you willing to visit the shelter to pick out your new fur-baby?</p>
        </div>
        <div class="answer-box ${adoption.willing_to_visit_shelter !== null ? 'filled' : ''}">
          ${adoption.willing_to_visit_shelter !== null 
            ? (adoption.willing_to_visit_shelter ? '☑ Yes ☐ No' : '☐ Yes ☑ No')
            : '<span class="answer-placeholder">☐ Yes ☐ No</span>'}
        </div>
      </div>

      <!-- Question 9: Are you willing to visit us a few more times after that? -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">9</div>
          <p class="question-text">Are you willing to visit us a few more times after that? (Your chosen furry companion will need to get to know you before you take him/her home!)</p>
        </div>
        <div class="answer-box ${adoption.willing_to_visit_again !== null ? 'filled' : ''}">
          ${adoption.willing_to_visit_again !== null 
            ? (adoption.willing_to_visit_again ? '☑ Yes ☐ No' : '☐ Yes ☑ No')
            : '<span class="answer-placeholder">☐ Yes ☐ No</span>'}
        </div>
      </div>

      <!-- Question 10: Are you adopting for yourself or others? -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">10</div>
          <p class="question-text">Are you adopting for yourself or others?</p>
        </div>
        <div class="answer-box ${adoption.adopting_for_self !== null ? 'filled' : ''}">
          ${adoption.adopting_for_self !== null 
            ? (adoption.adopting_for_self ? 'For myself' : 'For others')
            : '<span class="answer-placeholder">Please specify who you are adopting for</span>'}
        </div>
      </div>

      <!-- Question 11: Will you be able to give your new furry companion a loving FURrever home? -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">11</div>
          <p class="question-text">Will you be able to give your new furry companion a loving FURrever home? Tell us how.</p>
        </div>
        <div class="answer-box tall ${adoption.how_can_you_give_fur_rever_home ? 'filled' : ''}">
          ${adoption.how_can_you_give_fur_rever_home || '<span class="answer-placeholder">Please describe how you will provide a loving forever home</span>'}
        </div>
      </div>

      <!-- Question 12: We're curious. Where did you see/hear about us? -->
      <div class="question">
        <div class="question-header">
          <div class="question-number">12</div>
          <p class="question-text">We're curious. Where did you see/hear about us?</p>
        </div>
        <div class="answer-box ${adoption.where_did_you_hear_about_us ? 'filled' : ''}">
          ${adoption.where_did_you_hear_about_us || '<span class="answer-placeholder">Please tell us how you found out about our shelter</span>'}
        </div>
      </div>

      <!-- Signatures -->
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Applicant Signature</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Date</div>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for your interest in adopting! We will review your application and contact you soon.</p>
        <p>Form generated on ${today} for Application #${adoption.id}</p>
      </div>
    </div>
    
    <script>
      window.onload = function() { 
        setTimeout(function() { 
          window.print(); 
        }, 500); 
      }
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