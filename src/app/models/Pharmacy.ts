import { Order } from "./Order";
import { Product } from "./Product";
import { WorkingHours } from "./WorkingHours";
import { Location } from "./Location";
import {OpeningHours} from "./OpeningHours";

export class Pharmacy {
  id: string;
  name: string;
  address: string;
  logoUrl: string | null;
  ownerId: string;
  licenseNumber: string;
  siret: string;
  phoneNumber: string;
  email: string;
  status: 'active' | 'inactive' | 'deleted' | 'pending' | 'rejected' | 'suspended';
  location: Location;
  products: Product[];
  workingHours: WorkingHours;
  orders: Order[];
  totalRevenue: number;
  suspensionDate: Date | null;
  suspensionReason: string | null;
  registerDate: Date;
  orders30days: number | null;
  revenue30days: number | null;
  rating: number | null;
  openingHours: { [day: string]: OpeningHours };
  // revenues: number[];

  constructor(data: {
    id: string,
    name: string,
    address: string,
    logoUrl?: string | null,
    ownerId: string,
    licenseNumber?: string,
    siret?: string,
    phoneNumber?: string,
    email?: string,
    status: string,
    location_latitude: number,
    location_longitude: number,
    products?: Product[],
    workingHours: WorkingHours,
    orders?: Order[],
    totalRevenue?: number,
    suspensionDate?: Date | null,
    suspensionReason?: string | null,
    registerDate?: Date,
    orders30days?: number | null,
    revenue30days?: number | null,
    rating?: number | null,
    openingHours?: { [day: string]: OpeningHours }
  }) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.logoUrl = data.logoUrl ?? null;
    this.ownerId = data.ownerId;
    this.licenseNumber = data.licenseNumber ?? '';
    this.siret = data.siret ?? '';
    this.phoneNumber = data.phoneNumber ?? '';
    this.email = data.email ?? '';
    this.status = data.status as 'active' | 'inactive' | 'deleted' | 'pending' | 'rejected' | 'suspended';
    this.location = new Location({ latitude: data.location_latitude, longitude: data.location_longitude });
    this.products = (data.products ?? []).map(p => new Product(p));
    this.workingHours = new WorkingHours(data.workingHours);
    this.orders = (data.orders ?? []).map(o => new Order(o));
    this.totalRevenue = data.totalRevenue ?? 0;
    this.suspensionDate = data.suspensionDate ?? null;
    this.suspensionReason = data.suspensionReason ?? null;
    this.registerDate = data.registerDate ?? new Date();
    this.orders30days = data.orders30days ?? null;
    this.revenue30days = data.revenue30days ?? null;
    this.rating = data.rating ?? null;
    this.openingHours = data.openingHours ?? {};
  }

}
