export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  birthDate?: Date;
  weight: string;
  color: string;
  description: string;
  microchipId: string;
  vaccinated: string;
  photo?: string; // This will store base64 data URL
  photoFile?: File; // Store the original file for reference
  dateAdded: Date;
}
