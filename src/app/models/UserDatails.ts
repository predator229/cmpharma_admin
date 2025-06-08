import { ApiUserDetails } from "./ApiUserDetails";
import { Country } from "./Country";
import {SetupBase} from "./SetupBase";
import {Permission} from "./Permission.class";
import {OpeningHoursClass} from "./OpeningHours.class";
import {Group} from "./Group.class";
  export class UserDetails {
    groups: Group[];
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
      groups: Group[];
      permissions?: Permission[] | [String];
      isActivated?: boolean;
      lastLogin?: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }) {
      this.groups = data.groups ? data.groups.map((group: any) => new Group(group)) : [];
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
      this.isActivated = data.isActivated !== undefined ? data.isActivated : true;
      this.lastLogin = data.lastLogin || null;
      this.createdAt = data.createdAt;
      this.updatedAt = data.updatedAt;

      console.log(this);
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
        groups: data.user.groups ? data.user.groups.map((group: any) => new Group(group)) : [],
        isActivated: data.user.isActivated,
        lastLogin: data.user.lastLogin,
        createdAt: new Date(data.user.createdAt),
        updatedAt: new Date(data.user.updatedAt),
      });
    }
  }
