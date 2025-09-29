export enum PhilippineIDType {
  PHILSYS_ID = 'PHILSYS_ID',
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  SSS_ID = 'SSS_ID',
  UMID_CARD = 'UMID_CARD',
  GSIS_ID = 'GSIS_ID',
  PRC_ID = 'PRC_ID',
  TIN_ID = 'TIN_ID',
  POSTAL_ID = 'POSTAL_ID',
  VOTER_ID = 'VOTER_ID',
  PHILHEALTH_ID = 'PHILHEALTH_ID',
  PAGIBIG_ID = 'PAGIBIG_ID',
  SENIOR_CITIZEN_ID = 'SENIOR_CITIZEN_ID',
  PWD_ID = 'PWD_ID',
  STUDENT_ID = 'STUDENT_ID',
  OFW_ID = 'OFW_ID',
  NBI_CLEARANCE = 'NBI_CLEARANCE',
  POLICE_CLEARANCE = 'POLICE_CLEARANCE',
  BARANGAY_ID = 'BARANGAY_ID',
  FIREARMS_LICENSE_ID = 'FIREARMS_LICENSE_ID',
  IBP_ID = 'IBP_ID',
  SEAMAN_BOOK = 'SEAMAN_BOOK',
  ACR_I_CARD = 'ACR_I_CARD',
}

export const PhilippineIDTypeLabels: Record<PhilippineIDType, string> = {
  [PhilippineIDType.PHILSYS_ID]: 'Philippine National ID',
  [PhilippineIDType.PASSPORT]: 'Passport',
  [PhilippineIDType.DRIVER_LICENSE]: 'Driver\'s License',
  [PhilippineIDType.SSS_ID]: 'Social Security System ID/UMID',
  [PhilippineIDType.UMID_CARD]: 'Unified Multi-Purpose ID',
  [PhilippineIDType.GSIS_ID]: 'Government Service Insurance System ID',
  [PhilippineIDType.PRC_ID]: 'Professional Regulation Commission ID',
  [PhilippineIDType.TIN_ID]: 'Taxpayer Identification Number ID',
  [PhilippineIDType.POSTAL_ID]: 'Postal ID',
  [PhilippineIDType.VOTER_ID]: 'COMELEC ID',
  [PhilippineIDType.PHILHEALTH_ID]: 'PhilHealth ID',
  [PhilippineIDType.PAGIBIG_ID]: 'HDMF Loyalty Card Plus',
  [PhilippineIDType.SENIOR_CITIZEN_ID]: 'Senior Citizen ID',
  [PhilippineIDType.PWD_ID]: 'Person With Disability ID',
  [PhilippineIDType.STUDENT_ID]: 'Student ID (for currently enrolled students)',
  [PhilippineIDType.OFW_ID]: 'Overseas Filipino Worker ID',
  [PhilippineIDType.NBI_CLEARANCE]: 'NBI Clearance',
  [PhilippineIDType.POLICE_CLEARANCE]: 'Police Clearance',
  [PhilippineIDType.BARANGAY_ID]: 'Barangay ID',
  [PhilippineIDType.FIREARMS_LICENSE_ID]: 'Firearms License ID',
  [PhilippineIDType.IBP_ID]: 'Integrated Bar of the Philippines ID (for lawyers)',
  [PhilippineIDType.SEAMAN_BOOK]: 'Seafarer\'s Identification & Record Book',
  [PhilippineIDType.ACR_I_CARD]: 'Alien Certificate of Registration',
};

// Helper function to get all ID types as an array
export function getPhilippineIDTypes(): PhilippineIDType[] {
  return Object.values(PhilippineIDType);
}

// Helper function to get ID type label
export function getPhilippineIDTypeLabel(idType: PhilippineIDType): string {
  return PhilippineIDTypeLabels[idType];
}