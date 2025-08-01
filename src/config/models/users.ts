export interface User {
  id: string;
  created_at: string; // ISO Date string (you can also use Date if you plan to parse it)
  username: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | string; // Extend as needed
  role: number; // You can replace with an enum if roles are defined
  phone_number: string;
  house_images: string[] | null; // Assuming it's an array of image URLs or null
}
