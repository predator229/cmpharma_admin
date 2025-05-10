import { ApiUserDetails } from "./ApiUserDetails";
import { Country } from "./Country";
import {SetupBase} from "./SetupBase";


  export class UserDetails {
    id: string;
    email: string;
    name?: string;
    surname?: string;
    photoURL?: string;
    disabled: boolean;
    country?: Country;
    city?: string;
    address?: string;
    mobils?: string[];
    phone?: string;
    setups?: SetupBase;
    pharmaciesManaged: string[];
    role: 'superadmin' | 'admin' | 'manager' | 'pharmacist-owner' | 'pharmacits-manager';
    permissions: ('read' | 'write' | 'delete' | 'update')[];
    isActivated: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: {
      id: string;
      email: string;
      name: string;
      surname: string;
      photoURL?: string;
      disabled?: boolean;
      country?: Country;
      city?: string;
      address?: string;
      mobils?: string[];
      phone?: string;
      setups?: SetupBase;
      pharmaciesManaged?: string[];
      role: 'superadmin' | 'admin' | 'manager' | 'pharmacist-owner' | 'pharmacits-manager';
      permissions?: ('read' | 'write' | 'delete' | 'update')[];
      isActivated?: boolean;
      lastLogin?: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }) {
      this.id = data.id || '';
      this.email = data.email || '';
      this.name = data.name || '';
      this.surname = data.surname || '';
      this.photoURL = data.photoURL || '';
      this.disabled = data.disabled || false;
      this.country = data.country;
      this.city = data.city || '';
      this.address = data.address || '';
      this.mobils = data.mobils || [];
      this.setups = data.setups ?? null;
      this.phone = data.phone || '';
      this.pharmaciesManaged = data.pharmaciesManaged || [];
      this.role = data.role || 'admin';
      this.permissions = data.permissions || ['read', 'write'];
      this.isActivated = data.isActivated !== undefined ? data.isActivated : true;
      this.lastLogin = data.lastLogin || null;
      this.createdAt = data.createdAt;
      this.updatedAt = data.updatedAt;
    }

    static fromApiResponse(data: ApiUserDetails): UserDetails {
      return new UserDetails({
        id: data.user._id,
        email: data.user.email,
        name: data.user.name,
        surname: data.user.surname,
        photoURL: data.user.photoURL,
        disabled: data.user.disabled,
        country: data.user.country,
        city: data.user.city,
        address: data.user.address,
        mobils: data.user.mobils,
        phone: data.user.phone,
        setups: data.user.setups ?? null,
        pharmaciesManaged: data.user.pharmaciesManaged,
        role: data.user.role as UserDetails['role'],
        permissions: data.user.permissions,
        isActivated: data.user.isActivated,
        lastLogin: data.user.lastLogin,
        createdAt: new Date(data.user.createdAt),
        updatedAt: new Date(data.user.updatedAt),
      });
    }
  }
