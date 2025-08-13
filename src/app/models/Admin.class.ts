import { Group } from './Group.class';
import { Country } from './Country.class';
import { Mobil } from './Mobil.class';
import { Uid } from './Uid.class';
import {PharmacyClass} from "./Pharmacy.class";
import {CommonFunctions} from "../controllers/comonsfunctions";
import {SetupBase} from "./SetupBase";

export class Admin {
  _id?: string;

  // Identification
  uids: Uid[];
  email?: string;
  name?: string;
  surname?: string;

  // Profile
  photoURL?: string;
  disabled: boolean;

  // Location
  country?: Country;
  city?: string;
  address?: string;

  // Contact
  mobils: Mobil[];
  phone?: Mobil;

  // Pharmacy Management
  pharmaciesManaged: PharmacyClass[];

  // Access & Permissions
  groups: Group[];
  setups: SetupBase;

  // Status
  isActivated: boolean;
  lastLogin?: Date;

  // Security
  twoFactorEnabled?: boolean;
  passwordLastChanged?: Date;
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;

    // Identification
    this.uids = (data.uids || []).map((uid: any) => new Uid(uid));
    this.email = data.email;
    this.name = data.name;
    this.surname = data.surname;

    // Profile
    this.photoURL = data.photoURL;
    this.disabled = data.disabled ?? false;

    // Location
    this.country = data.country ? new Country(data.country) : undefined;
    this.city = data.city;
    this.address = data.address;

    // Contact
    this.mobils = (data.mobils || []).map((mobil: any) => new Mobil(mobil));
    this.phone = data.phone ? new Mobil(data.phone) : undefined;

    // Pharmacy Management
    this.pharmaciesManaged = (data.pharmaciesManaged || []).map((pharmacy: any) =>
      CommonFunctions.mapToPharmacy(pharmacy)
    );

    // Access & Permissions
    this.groups = (data.groups || []).map((group: any) => new Group(group));
    this.setups = data.setups;

    // Status
    this.isActivated = data.isActivated ?? true;
    this.lastLogin = data.lastLogin ? new Date(data.lastLogin) : undefined;

    // Security
    this.twoFactorEnabled = data.twoFactorEnabled ?? false;
    this.passwordLastChanged = data.passwordLastChanged ? new Date(data.passwordLastChanged) : undefined;
    this.failedLoginAttempts = data.failedLoginAttempts ?? 0;
    this.accountLockedUntil = data.accountLockedUntil ? new Date(data.accountLockedUntil) : undefined;

    // Timestamps
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  getFullName(): string {
    const parts = [this.name, this.surname].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : this.email || 'Utilisateur sans nom';
  }

  getInitials(): string {
    const name = this.name?.charAt(0) || '';
    const surname = this.surname?.charAt(0) || '';
    return (name + surname).toUpperCase() || this.email?.charAt(0).toUpperCase() || 'U';
  }

  isActive(): boolean {
    return !this.disabled && this.isActivated;
  }

  isAccountLocked(): boolean {
    return this.accountLockedUntil ? new Date() < this.accountLockedUntil : false;
  }

  hasRole(roleCode: string): boolean {
    return this.groups.some(group => group.code === roleCode);
  }

  hasPermission(permission: string): boolean {
    return this.groups.some(group =>
      group.permissions && group.permissions.some( perm => perm.permissions.includes(permission))
    );
  }

  canManagePharmacy(pharmacyId: string): boolean {
    return this.pharmaciesManaged.some(pharmacy => pharmacy.id === pharmacyId);
  }

  getRoles(): string[] {
    return this.groups.map(group => group.code || group.name);
  }

  getRoleLabels(): string[] {
    const roleMap: { [key: string]: string } = {
      'manager_pharmacy': 'Gestionnaire de Pharmacie',
      'pharmacien': 'Pharmacien',
      'preparateur': 'Préparateur',
      'caissier': 'Caissier',
      'consultant': 'Consultant'
    };

    return this.groups.map(group =>
      roleMap[group.code] || group.name || 'Rôle inconnu'
    );
  }

  getHighestRole(): string {
    const roleHierarchy = [
      'manager_pharmacy',
      'pharmacien',
      'preparateur',
      'caissier',
      'consultant'
    ];

    for (const role of roleHierarchy) {
      if (this.hasRole(role)) {
        return role;
      }
    }

    return this.groups.length > 0 ? this.groups[0].code : 'no_role';
  }

  getContactInfo(): string {
    const parts = [];

    if (this.phone?.digits) {
      parts.push(this.phone.digits);
    }

    if (this.address) {
      parts.push(this.address);
    }

    if (this.city) {
      parts.push(this.city);
    }

    if (this.country?.name) {
      parts.push(this.country.name);
    }

    return parts.join(', ') || 'Aucune information de contact';
  }

  getStatusBadgeClass(): string {
    if (!this.isActivated) return 'bg-secondary';
    if (this.disabled) return 'bg-danger';
    if (this.isAccountLocked()) return 'bg-warning';
    return 'bg-success';
  }

  getStatusLabel(): string {
    if (!this.isActivated) return 'Non activé';
    if (this.disabled) return 'Désactivé';
    if (this.isAccountLocked()) return 'Bloqué';
    return 'Actif';
  }

  needsPasswordChange(): boolean {
    if (!this.passwordLastChanged) return true;

    // Password expires after 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return this.passwordLastChanged < ninetyDaysAgo;
  }

  getPasswordAge(): number {
    if (!this.passwordLastChanged) return Infinity;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.passwordLastChanged.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
  }

  getLastLoginFormatted(): string {
    if (!this.lastLogin) return 'Jamais connecté';

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.lastLogin.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;

    return `Il y a ${Math.floor(diffDays / 365)} ans`;
  }

  canAccessPharmacyModule(): boolean {
    const pharmacyRoles = ['manager_pharmacy', 'pharmacien', 'preparateur', 'caissier'];
    return pharmacyRoles.some(role => this.hasRole(role));
  }

  canManageUsers(): boolean {
    return this.hasRole('manager_pharmacy') || this.hasPermission('users.manage');
  }

  canViewReports(): boolean {
    return this.hasRole('manager_pharmacy') ||
      this.hasRole('pharmacien') ||
      this.hasPermission('reports.view');
  }

  isManager(): boolean {
    return this.hasRole('manager_pharmacy');
  }

  isPharmacist(): boolean {
    return this.hasRole('pharmacien');
  }

}
