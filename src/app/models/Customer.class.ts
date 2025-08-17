import { Country } from './Country.class';
import {Mobil} from "./Mobil.class";

export interface CustomerAddress {
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: Country;
  phone?: string;
  instructions?: string;
}

export interface MedicalInfo {
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  emergencyContact: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

export interface CustomerPreferences {
  newsletter: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  preferredPharmacy?: string;
  language: string;
  currency: string;
}

export interface IdentityDocument {
  type?: 'passport' | 'id_card' | 'driver_license';
  number?: string;
  expiryDate?: Date;
  verified: boolean;
}

export class CustomerClass {
  _id?: string;

  // Informations personnelles
  firstName: string;
  lastName: string;
  email: string;
  phones: Mobil[];
  defaultPhone?: Mobil | null;

  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';

  // Authentification
  emailVerified: boolean;
  phoneVerified: boolean;

  // Statut du compte
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  isBlacklisted: boolean;
  blacklistReason?: string;

  // Adresses
  addresses: CustomerAddress[];

  // Informations médicales
  medicalInfo: MedicalInfo;

  // Préférences
  preferences: CustomerPreferences;

  // Statistiques
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  registrationDate: Date;
  lastLoginDate?: Date;

  // Programme de fidélité
  loyaltyPoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';

  // Documents d'identité
  identityDocument: IdentityDocument;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;

    // Informations personnelles
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.email = data.email || '';
    this.phones = data.phones ? data.phones.map((phone: any) => new Mobil(phone)) : [];

    if (data.defaultPhone) {
      this.defaultPhone = new Mobil(data.defaultPhone);
    } else {
      this.defaultPhone = this.phones[0];
    }

    this.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
    this.gender = data.gender;

    // Authentification
    this.emailVerified = data.emailVerified ?? false;
    this.phoneVerified = data.phoneVerified ?? false;

    // Statut du compte
    this.status = data.status || 'active';
    this.isBlacklisted = data.isBlacklisted ?? false;
    this.blacklistReason = data.blacklistReason;

    // Adresses
    this.addresses = (data.addresses || []).map((addr: any) => ({
      ...addr,
      country: addr.country ? new Country(addr.country) : undefined
    }));

    // Informations médicales
    this.medicalInfo = {
      allergies: data.medicalInfo?.allergies || [],
      chronicConditions: data.medicalInfo?.chronicConditions || [],
      currentMedications: data.medicalInfo?.currentMedications || [],
      emergencyContact: data.medicalInfo?.emergencyContact || {}
    };

    // Préférences
    this.preferences = {
      newsletter: data.preferences?.newsletter ?? true,
      smsNotifications: data.preferences?.smsNotifications ?? true,
      emailNotifications: data.preferences?.emailNotifications ?? true,
      preferredPharmacy: data.preferences?.preferredPharmacy,
      language: data.preferences?.language || 'fr',
      currency: data.preferences?.currency || 'EUR'
    };

    // Statistiques
    this.totalOrders = data.totalOrders || 0;
    this.totalSpent = data.totalSpent || 0;
    this.averageOrderValue = data.averageOrderValue || 0;
    this.lastOrderDate = data.lastOrderDate ? new Date(data.lastOrderDate) : undefined;
    this.registrationDate = data.registrationDate ? new Date(data.registrationDate) : new Date();
    this.lastLoginDate = data.lastLoginDate ? new Date(data.lastLoginDate) : undefined;

    // Programme de fidélité
    this.loyaltyPoints = data.loyaltyPoints || 0;
    this.loyaltyTier = data.loyaltyTier || 'bronze';

    // Documents d'identité
    this.identityDocument = {
      type: data.identityDocument?.type,
      number: data.identityDocument?.number,
      expiryDate: data.identityDocument?.expiryDate ? new Date(data.identityDocument.expiryDate) : undefined,
      verified: data.identityDocument?.verified ?? false
    };

    // Timestamps
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim() || this.email;
  }

  getInitials(): string {
    const firstInitial = this.firstName?.charAt(0) || '';
    const lastInitial = this.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || this.email?.charAt(0).toUpperCase() || 'C';
  }

  isActive(): boolean {
    return this.status === 'active' && !this.isBlacklisted;
  }

  getDefaultAddress(): CustomerAddress | undefined {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
  }

  getAge(): number | undefined {
    if (!this.dateOfBirth) return undefined;

    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  getLoyaltyTierLabel(): string {
    const tierLabels = {
      bronze: 'Bronze',
      silver: 'Argent',
      gold: 'Or',
      platinum: 'Platine'
    };
    return tierLabels[this.loyaltyTier] || 'Bronze';
  }

  getStatusBadgeClass(): string {
    if (this.isBlacklisted) return 'bg-danger';

    const statusClasses = {
      active: 'bg-success',
      inactive: 'bg-secondary',
      suspended: 'bg-warning',
      deleted: 'bg-danger'
    };

    return statusClasses[this.status] || 'bg-secondary';
  }

  getStatusLabel(): string {
    if (this.isBlacklisted) return 'Blacklisté';

    const statusLabels = {
      active: 'Actif',
      inactive: 'Inactif',
      suspended: 'Suspendu',
      deleted: 'Supprimé'
    };

    return statusLabels[this.status] || 'Inconnu';
  }

  canReceiveNotifications(type: 'email' | 'sms'): boolean {
    if (type === 'email') return this.preferences.emailNotifications && this.emailVerified;
    if (type === 'sms') return this.preferences.smsNotifications && this.phoneVerified;
    return false;
  }

  hasAllergies(): boolean {
    return this.medicalInfo.allergies.length > 0;
  }

  hasChronicConditions(): boolean {
    return this.medicalInfo.chronicConditions.length > 0;
  }

  isIdentityVerified(): boolean {
    return this.identityDocument.verified;
  }
}
