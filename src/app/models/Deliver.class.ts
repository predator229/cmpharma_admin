import {Country} from "./Country.class";
import {Mobil} from "./Mobil.class";
import {Uid} from "./Uid.class";

interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Deliver implements BaseDocument {
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
  vehicleType?: string;
  marqueVehicule?: string;
  modelVehicule?: string;
  anneeVehicule?: string;
  nrEssieux?: string;
  capaciteCharge?: string;
  nrImmatriculation?: string;
  nrAssurance?: Date;
  nrChassis?: string;
  nrPermis?: string;
  nrVisiteTechnique?: Date;
  nrCarteGrise?: string;
  nrContrat?: string;
  isActivated: boolean;
  coins: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Deliver>) {
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
    this.vehicleType = data.vehicleType;
    this.marqueVehicule = data.marqueVehicule;
    this.modelVehicule = data.modelVehicule;
    this.anneeVehicule = data.anneeVehicule;
    this.nrEssieux = data.nrEssieux;
    this.capaciteCharge = data.capaciteCharge;
    this.nrImmatriculation = data.nrImmatriculation;
    this.nrAssurance = data.nrAssurance;
    this.nrChassis = data.nrChassis;
    this.nrPermis = data.nrPermis;
    this.nrVisiteTechnique = data.nrVisiteTechnique;
    this.nrCarteGrise = data.nrCarteGrise;
    this.nrContrat = data.nrContrat;
    this.isActivated = data.isActivated || false;
    this.coins = data.coins || 0;
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
