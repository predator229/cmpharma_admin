import {Product} from "./Product";
import {CustomerClass} from "./Customer.class";
import {PharmacyClass} from "./Pharmacy.class";
import {OrderClass} from "./Order.class";
import {FileClass} from "./File.class";
import {CommonFunctions} from "../controllers/comonsfunctions";

export interface Doctor {
  name: string;
  rppsNumber?: string;
  specialty?: string;
  address?: string;
  phone?: string;
}

export interface Medication {
  product?: Product;
  medicationName: string;
  dosage: string;
  quantity: number;
  instructions?: string;
  duration?: string;
  substitutionAllowed: boolean;
}

export interface PatientInfo {
  age?: number;
  weight?: number;
  allergies: string[];
  chronicConditions: string[];
}

export class PrescriptionClass {
  _id?: string;

  customer: CustomerClass | null;
  pharmacy: PharmacyClass | null;
  order?: OrderClass | null;

  // Informations du médecin
  doctor: Doctor;

  // Document d'ordonnance
  prescriptionDocument: string;
  prescriptionNumber?: string;
  issueDate: Date;
  expiryDate: Date;

  // Médicaments prescrits
  medications: Medication[];

  // Statut
  status: 'pending' | 'validated' | 'partially_filled' | 'filled' | 'rejected' | 'expired';

  // Validation
  validatedBy?: string;
  validatedAt?: Date;
  validationNotes?: string;

  // Informations complémentaires
  patientInfo: PatientInfo;

  document?: FileClass | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;

    this.customer = data.customer ? new CustomerClass(data.customer) : null;
    this.pharmacy = data.pharmacy ? CommonFunctions.mapToPharmacy(data.pharmacy) : null;

    this.order = data.order ? new OrderClass(data.order) : null;
    this.document = data.document ? new FileClass(data.document) : null;

    this.doctor = {
      name: data.doctor?.name || '',
      rppsNumber: data.doctor?.rppsNumber,
      specialty: data.doctor?.specialty,
      address: data.doctor?.address,
      phone: data.doctor?.phone
    };

    this.prescriptionDocument = data.prescriptionDocument || '';
    this.prescriptionNumber = data.prescriptionNumber;
    this.issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
    this.expiryDate = data.expiryDate ? new Date(data.expiryDate) : new Date();

    this.medications = (data.medications || []).map((med: any) => ({
      ...med,
      product: med.product ? new Product(med.product) : undefined
    }));

    this.status = data.status || 'pending';

    this.validatedBy = data.validatedBy;
    this.validatedAt = data.validatedAt ? new Date(data.validatedAt) : undefined;
    this.validationNotes = data.validationNotes;

    this.patientInfo = {
      age: data.patientInfo?.age,
      weight: data.patientInfo?.weight,
      allergies: data.patientInfo?.allergies || [],
      chronicConditions: data.patientInfo?.chronicConditions || []
    };

    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  getStatusLabel(): string {
    const statusLabels = {
      pending: 'En attente',
      validated: 'Validée',
      partially_filled: 'Partiellement honorée',
      filled: 'Honorée',
      rejected: 'Rejetée',
      expired: 'Expirée'
    };
    return statusLabels[this.status] || 'Inconnu';
  }

  getStatusBadgeClass(): string {
    const statusClasses = {
      pending: 'bg-warning',
      validated: 'bg-success',
      partially_filled: 'bg-info',
      filled: 'bg-success',
      rejected: 'bg-danger',
      expired: 'bg-secondary'
    };
    return statusClasses[this.status] || 'bg-secondary';
  }

  isExpired(): boolean {
    return new Date() > this.expiryDate || this.status === 'expired';
  }

  isValid(): boolean {
    return !this.isExpired() && this.status !== 'rejected';
  }

  getTotalMedications(): number {
    return this.medications.length;
  }

  getDaysUntilExpiry(): number {
    const now = new Date();
    const diffTime = this.expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
