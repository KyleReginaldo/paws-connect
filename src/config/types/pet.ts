export interface Pet {
  id: number;
  created_at: string;
  name: string;
  type: string;
  breed: string;
  color?: string;
  gender: string;
  age: number;
  date_of_birth: string;
  size: string;
  weight: string;
  is_vaccinated: boolean;
  is_spayed_or_neutured: boolean;
  health_status: string;
  good_with: string[];
  is_trained: boolean;
  rescue_address: string;
  description: string;
  special_needs: string;
  added_by: string;
  request_status: string;
  photos: string[];
  /**
   * Whether the requesting user (provided via ?user=<userId> query param) has favorited this pet.
   * This is injected dynamically by the API layer and not stored on the pets table.
   */
  /** @deprecated Use isFavorite (camelCase). Left temporarily for backward compatibility. */
  is_favorite?: boolean;
  /** 
   * Adoption information including happiness image if the pet is adopted.
   * This is populated by joining with the adoption table.
   */
  adoption?: Array<{
    id: number;
    status: string | null;
    happiness_image: string | null;
    user: {
      id: string;
      username: string | null;
      email: string | null;
    } | null;
  }>;
  /** 
   * Computed field indicating if this pet has been adopted (approved adoption).
   * This is populated by the API based on adoption status.
   */
  adopted?: {
    id: number;
    status: string;
    happiness_image?: string | null;
  } | null;
}
