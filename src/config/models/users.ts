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
}
