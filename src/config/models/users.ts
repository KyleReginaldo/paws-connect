export interface User {
  id: string;
  created_at: string; // ISO Date string (you can also use Date if you plan to parse it)
  username: string | undefined | null;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'FULLY_VERIFIED' | 'SEMI_VERIFIED' | 'INDEFINITE' | 'PENDING' | string; // Extend as needed
  role: number; // 1=Admin, 2=Staff, 3=User
  phone_number: string;
  profile_image_link: string | null;
  house_images: string[] | null; 
  onboarded?: boolean | null; // Whether the user has completed onboarding
  violations?: string[] | null; // Array of violation descriptions with timestamps
  user_identification?: {
    id: number;
    first_name: string;
    last_name: string;
    middle_initial: string | null;
    id_attachment_url: string;
    id_type: string | null;
    date_of_birth: string | null;
    address: string | null;
    status: string | null;
    user: string | null;
    created_at: string;
  } | null;
}
