import {Uid} from "./Uid.class";
import {Country} from "./Country";
import {Mobil} from "./Mobil.class";

interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer implements BaseDocument {
  _id?: string;
  uids?: (string | Uid)[];
  email?: string;
  name?: string;
  surname?: string;
  photoURL?: string;
  disabled: boolean;
  country?: string | Country;
  city?: string;
  address?: string;
  mobils?: (string | Mobil)[];
  phone?: string | Mobil;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  medicalConditions?: string[];
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  isVerified: boolean;
  preferredLanguage?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Customer>) {
    this.uids = data.uids || [];
    this.email = data.email;
    this.name = data.name;
    this.surname = data.surname;
    this.photoURL = data.photoURL;
    this.disabled = data.disabled || false;
    this.country = data.country;
    this.city = data.city;
    this.address = data.address;
    this.mobils = data.mobils || [];
    this.phone = data.phone;
    this.dateOfBirth = data.dateOfBirth;
    this.gender = data.gender;
    this.medicalConditions = data.medicalConditions || [];
    this.allergies = data.allergies || [];
    this.emergencyContact = data.emergencyContact;
    this.isVerified = data.isVerified || false;
    this.preferredLanguage = data.preferredLanguage;
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

