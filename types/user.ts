export type AccountType = 'private' | 'business';

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface UserAddress {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface BusinessInfo {
  companyName: string;
  vatId: string;
  tradeRegisterNumber: string;
}

export interface User {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  address: UserAddress;
  accountType: AccountType;
  businessInfo?: BusinessInfo;
  identityVerificationStatus: VerificationStatus;
  documentVerificationStatus: VerificationStatus;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationData {
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  address: UserAddress;
  accountType: AccountType;
  businessInfo?: BusinessInfo;
}
