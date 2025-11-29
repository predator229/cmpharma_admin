import {WorkingHours} from "./WorkingHours";
import {Location} from "./Location";
import {Image} from "./Image.class";
import {OpeningHoursClass} from "./OpeningHours.class";
import {FileClass} from "./File.class";
import {Country} from "./Country.class";
import {DeliveryZoneClass} from "./DeliveryZone.class";
import {ZoneCoordinates} from "./ZoneCoordinates.class";
import {TaxeModel} from "./Taxe.class";
import {CurrencyModel} from "./Currency.class";

export interface FileDocument {
  name: string;
  file: FileClass;
}

export interface DocumentsPharmacy {
  logo?: FileClass,
  license?: FileClass,
  idDocument?: FileClass,
  insurance?: FileClass,
}

export interface DeliveryServices {
  homeDelivery: boolean,
  pickupInStore: boolean,
  expressDelivery: boolean,
  scheduledDelivery: boolean
}

export enum RateUpdateFrequency {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MANUAL = 'manual'
}

export enum RoundingMethod {
  UP = 'up',
  DOWN = 'down',
  NEAREST = 'nearest'
}

export interface CurrencySettings {
  accept_multiple_currencies: boolean;
  accepted_currencies: CurrencyModel[];
  apply_conversion_markup: boolean;
  conversion_markup_percentage: number;
  round_converted_prices: boolean;
  rounding_method: RoundingMethod;
  auto_update_rates?: boolean;
  rate_update_frequency?: RateUpdateFrequency;
}

export class PharmacyClass {
  id: string;
  name: string;
  address: string;
  logoUrl: Image | null;
  ownerId: string | null;
  licenseNumber: string | null;
  siret: string | null;
  phoneNumber: string;
  email: string;
  status: 'active' | 'inactive' | 'deleted' | 'pending' | 'rejected' | 'suspended';
  location: Location | null;
  suspensionDate: Date | null;
  suspensionReason: string | null;
  registerDate: Date;
  rating: number | null;
  workingHours: OpeningHoursClass[];
  commentaire?: string | null;

  createdAt: Date | null;
  updatedAt: Date | null;

  totalRevenue?: number;
  orders30days?: number | null;
  revenue30days?: number | null;

  documents?: DocumentsPharmacy | null;
  city? : string;
  country?: Country | null;

  deliveryZone?: DeliveryZoneClass | null;
  cityBounds?: ZoneCoordinates | null;
  deliveryServices?: DeliveryServices | null;

  defaultsTaxes?: TaxeModel[];
  currency: CurrencyModel;
  currency_settings?: CurrencySettings;

  constructor(data: {
    id: string;
    name: string;
    address: string;
    logoUrl?: Image | null;
    ownerId?: string | null;
    licenseNumber?: string | null;
    siret?: string | null;
    phoneNumber: string;
    email: string;
    status: 'active' | 'inactive' | 'deleted' | 'pending' | 'rejected' | 'suspended';
    currency: CurrencyModel;
    currency_settings: CurrencySettings;
    location?: Location | null;
    suspensionDate?: Date | null;
    suspensionReason?: string | null;
    registerDate?: Date;
    rating?: number | null;
    workingHours?: OpeningHoursClass[] | null;
    commentaire?: string | null; // Fixed typo in constructor parameter
    createdAt?: Date;
    updatedAt?: Date;
    totalRevenue?: number;
    orders30days?: number | null;
    revenue30days?: number | null;
    documents?: DocumentsPharmacy | null;
    city?: string;
    country?: Country | null;
    deliveryZone?: DeliveryZoneClass | null;
    cityBounds?: ZoneCoordinates | null;
    deliveryServices?: DeliveryServices | null;
    defaultsTaxes?: TaxeModel[] | null;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.logoUrl = data.logoUrl ?? null;
    this.ownerId = data.ownerId ?? null;
    this.licenseNumber = data.licenseNumber ?? null;
    this.siret = data.siret ?? null;
    this.phoneNumber = data.phoneNumber;
    this.email = data.email;
    this.status = data.status;
    this.location = data.location ?? null;
    this.suspensionDate = data.suspensionDate ?? null;
    this.suspensionReason = data.suspensionReason ?? null;
    this.registerDate = data.registerDate ?? new Date();
    this.rating = data.rating ?? null;
    this.workingHours = data.workingHours ? data.workingHours.map(w => new OpeningHoursClass(w)) : null;
    this.commentaire = data.commentaire ?? null; // Fixed typo and default value
    this.createdAt = data.createdAt ? new Date(data.createdAt) : null;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;

    this.totalRevenue = data.totalRevenue ?? 0;
    this.orders30days = data.orders30days ?? null;
    this.revenue30days = data.revenue30days ?? null;

    this.documents = data.documents ?? null;
    this.city = data.city ?? null;
    this.country = data.country ?? null;

    this.deliveryZone = data.deliveryZone ?? null;
    this.cityBounds = data.cityBounds ?? null;
    this.deliveryServices = data.deliveryServices ?? null;

    this.defaultsTaxes = data.defaultsTaxes?.map(taxe => new TaxeModel(taxe)) ?? [];

    this.currency = new CurrencyModel(data.currency);
    this.currency_settings = data.currency_settings;
  }

  roundedPrice(price: number): number {
    if (!this.currency_settings?.round_converted_prices) {
      return price;
    }

    const rounding = this.currency_settings.rounding_method || RoundingMethod.NEAREST;
    const multiplier = 100;

    switch (rounding) {
      case RoundingMethod.UP:
        return Math.ceil(price * multiplier) / multiplier;
      case RoundingMethod.DOWN:
        return Math.floor(price * multiplier) / multiplier;
      case RoundingMethod.NEAREST:
      default:
        return Math.round(price * multiplier) / multiplier;
    }
  }
}
