export interface User {
  id: string;
  created_at: string; // ISO Date string (you can also use Date if you plan to parse it)
  username: string | undefined | null;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | string; // Extend as needed
  role: number; // You can replace with an enum if roles are defined
  phone_number: string;
  profile_image_link: string | null;
  house_images: string[] | null; 
}
