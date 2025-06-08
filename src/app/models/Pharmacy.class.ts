import { WorkingHours } from "./WorkingHours";
import { Location } from "./Location";
import { Image } from "./Image.class";
import {OpeningHoursClass} from "./OpeningHours.class";

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
  createdAt: Date | null;
  updatedAt: Date | null;

  // Champs front uniquement, pas dans la BDD
  totalRevenue?: number;
  orders30days?: number | null;
  revenue30days?: number | null;

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
    location?: Location | null;
    suspensionDate?: Date | null;
    suspensionReason?: string | null;
    registerDate?: Date;
    rating?: number | null;
    workingHours?: OpeningHoursClass[];
    createdAt?: Date;
    updatedAt?: Date;
    totalRevenue?: number;
    orders30days?: number | null;
    revenue30days?: number | null;
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
    this.workingHours = (data.workingHours ?? []).map(w => new OpeningHoursClass(w));
    this.createdAt = data.createdAt ? new Date(data.createdAt) : null;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;

    this.totalRevenue = data.totalRevenue ?? 0;
    this.orders30days = data.orders30days ?? null;
    this.revenue30days = data.revenue30days ?? null;
  }
}
