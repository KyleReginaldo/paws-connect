export interface Pet {
  id: number;
  created_at: string;
  name: string;
  type: string;
  breed: string;
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
  photo: string;
  color: string;
}
