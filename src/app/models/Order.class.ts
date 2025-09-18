import {Product} from "./Product";
import {Country} from "./Country";
import {CustomerClass} from "./Customer.class";
import {PharmacyClass} from "./Pharmacy.class";
import {CommonFunctions} from "../controllers/comonsfunctions";
import {PrescriptionClass} from "./Prescription.class";
import {Admin} from "./Admin.class";
import {InvoiceClass} from "./Invoice.class";
import {BonFiscalClass} from "./BonFiscal.class";

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  prescriptionRequired: boolean;
  prescriptionProvided: boolean;
  prescriptionDocument?: PrescriptionClass;
}

export interface DeliveryInfo {
  trackingUrl?: string;
  method: 'home_delivery' | 'pickup' | 'express' | 'scheduled';
  address: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    postalCode: string;
    country: Country | null;
    phone?: string;
    instructions?: string;
  };
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  trackingNumber?: string;
  deliveryProvider?: string;
}

export interface PaymentInfo {
  method: 'card' | 'paypal' | 'bank_transfer' | 'cash' | 'insurance';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  transactionId?: string;
  paidAt?: Date;
  refundAmount: number;
  refundReason?: string;
}

export interface CouponInfo {
  code?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  appliedDiscount: number;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
  updatedBy?: string;
}

export interface ReturnInfo {
  isReturnable: boolean;
  returnReason?: string;
  returnDate?: Date;
  refundStatus: 'none' | 'requested' | 'approved' | 'processed';
}

export interface ClientNotes {
  note: string;
  createdAt: Date;
  updatedAt: Date;
  from: CustomerClass;
  to: PharmacyClass;
}

export interface PharmacyNotes {
  note: string;
  createdAt: Date;
  updatedAt: Date;
  from: Admin;
  to: CustomerClass;
}

export interface InternalNotes {
  note: string;
  createdAt: Date;
  updatedAt: Date;
  from: Admin;
  to: Admin;
  type: 'to_person' | 'to_pharmacy' | 'to_admin' | 'to_general';
}

export class OrderClass {
  _id?: string;

  // Référence unique
  orderNumber: string;

  // Relations
  customer: CustomerClass | null;
  pharmacy: PharmacyClass | null;

  // Statut de la commande
  status: 'pending' | 'confirmed' | 'prescription_pending' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled' | 'returned' | 'refunded';

  // Articles commandés
  items: OrderItem[];

  // Totaux
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;

  // Informations de livraison
  deliveryInfo: DeliveryInfo;

  // Paiement
  payment: PaymentInfo;

  // Coupon/Promotion
  coupon: CouponInfo;

  // Notes et commentaires
  clientNotes : ClientNotes[];
  pharmacyNotes : PharmacyNotes[];
  internalNotes : InternalNotes[];

  // Dates importantes
  orderDate: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;

  invoice: InvoiceClass | null;
  bonfiscal: BonFiscalClass | null;

  // Historique des statuts
  statusHistory: StatusHistoryEntry[];

  // Informations de retour/échange
  returnInfo: ReturnInfo;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;
    this.orderNumber = data.orderNumber || '';

    // Relations
    this.customer = data.customer ? new CustomerClass(data.customer) : new CustomerClass({});
    this.pharmacy = data.pharmacy ? CommonFunctions.mapToPharmacy(data.pharmacy) : null;

    // Statut
    this.status = data.status || 'pending';

    // Articles
    this.items = (data.items || []).map((item: any) => ({
      ...item,
      product: item.product ? new Product(item.product) : new Product({})
    }));

    // Totaux
    this.subtotal = data.subtotal || 0;
    this.shippingCost = data.shippingCost || 0;
    this.taxAmount = data.taxAmount || 0;
    this.discountAmount = data.discountAmount || 0;
    this.totalAmount = data.totalAmount || 0;

    // Livraison
    this.deliveryInfo = {
      trackingUrl: data.deliveryInfo?.trackingUrl ?? '',
      method: data.deliveryInfo?.method || 'home_delivery',
      address: {
        ...data.deliveryInfo?.address,
        country: data.deliveryInfo?.address?.country ? new Country(data.deliveryInfo.address.country) : null
      },
      estimatedDeliveryDate: data.deliveryInfo?.estimatedDeliveryDate ? new Date(data.deliveryInfo.estimatedDeliveryDate) : undefined,
      actualDeliveryDate: data.deliveryInfo?.actualDeliveryDate ? new Date(data.deliveryInfo.actualDeliveryDate) : undefined,
      trackingNumber: data.deliveryInfo?.trackingNumber,
      deliveryProvider: data.deliveryInfo?.deliveryProvider
    };

    // Paiement
    this.payment = {
      method: data.payment?.method || 'card',
      status: data.payment?.status || 'pending',
      transactionId: data.payment?.transactionId,
      paidAt: data.payment?.paidAt ? new Date(data.payment.paidAt) : undefined,
      refundAmount: data.payment?.refundAmount || 0,
      refundReason: data.payment?.refundReason
    };

    // Coupon
    this.coupon = {
      code: data.coupon?.code,
      discountType: data.coupon?.discountType,
      discountValue: data.coupon?.discountValue,
      appliedDiscount: data.coupon?.appliedDiscount || 0
    };

    // Notes
    this.clientNotes = data.clientNotes;
    this.pharmacyNotes = data.pharmacyNotes;
    this.internalNotes = data.internalNotes;


    // Dates
    this.orderDate = data.orderDate ? new Date(data.orderDate) : new Date();
    this.confirmedAt = data.confirmedAt ? new Date(data.confirmedAt) : undefined;
    this.shippedAt = data.shippedAt ? new Date(data.shippedAt) : undefined;
    this.deliveredAt = data.deliveredAt ? new Date(data.deliveredAt) : undefined;
    this.completedAt = data.completedAt ? new Date(data.completedAt) : undefined;

    this.invoice = data.invoice ? new InvoiceClass(data.invoice) : null;
    this.bonfiscal = data.bonfiscal ? new BonFiscalClass(data.bonfiscal) : null;

    // Historique
    this.statusHistory = (data.statusHistory || []).map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));

    // Retour
    this.returnInfo = {
      isReturnable: data.returnInfo?.isReturnable ?? true,
      returnReason: data.returnInfo?.returnReason,
      returnDate: data.returnInfo?.returnDate ? new Date(data.returnInfo.returnDate) : undefined,
      refundStatus: data.returnInfo?.refundStatus || 'none'
    };

    // Timestamps
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  getStatusLabel(): string {
    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      prescription_pending: 'En attente de prescription',
      preparing: 'En préparation',
      ready_for_pickup: 'Prête pour retrait',
      out_for_delivery: 'En cours de livraison',
      delivered: 'Livrée',
      completed: 'Terminée',
      cancelled: 'Annulée',
      returned: 'Retournée',
      refunded: 'Remboursée'
    };
    return statusLabels[this.status] || 'Inconnu';
  }

  getStatusBadgeClass(): string {
    const statusClasses = {
      pending: 'bg-warning',
      confirmed: 'bg-info',
      prescription_pending: 'bg-warning',
      preparing: 'bg-primary',
      ready_for_pickup: 'bg-info',
      out_for_delivery: 'bg-primary',
      delivered: 'bg-success',
      completed: 'bg-success',
      cancelled: 'bg-danger',
      returned: 'bg-secondary',
      refunded: 'bg-secondary'
    };
    return statusClasses[this.status] || 'bg-secondary';
  }

  getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  isPaid(): boolean {
    return this.payment.status === 'paid';
  }

  isDelivered(): boolean {
    return ['delivered', 'completed'].includes(this.status);
  }

  isCancellable(): boolean {
    return ['pending', 'confirmed'].includes(this.status);
  }

  isReturnable(): boolean {
    return this.returnInfo.isReturnable && this.isDelivered() && this.getReturnDeadline() > new Date();
  }

  getReturnDeadline(): Date {
    // 14 jours pour retourner après livraison
    const deadline = new Date(this.deliveredAt || this.completedAt || new Date());
    deadline.setDate(deadline.getDate() + 14);
    return deadline;
  }

  requiresPrescription(): boolean {
    return this.items.some(item => item.prescriptionRequired);
  }

  hasPrescriptionPending(): boolean {
    return this.items.some(item => item.prescriptionRequired && !item.prescriptionProvided);
  }

  getDeliveryMethodLabel(): string {
    const methodLabels = {
      home_delivery: 'Livraison à domicile',
      pickup: 'Retrait en pharmacie',
      express: 'Livraison express',
      scheduled: 'Livraison programmée'
    };
    return methodLabels[this.deliveryInfo.method] || 'Inconnu';
  }

  getPaymentMethodLabel(): string {
    const methodLabels = {
      card: 'Carte bancaire',
      paypal: 'PayPal',
      bank_transfer: 'Virement bancaire',
      cash: 'Espèces',
      insurance: 'Assurance'
    };
    return methodLabels[this.payment.method] || 'Inconnu';
  }

  getLastStatusUpdate(): StatusHistoryEntry | undefined {
    return this.statusHistory.length > 0 ? this.statusHistory[this.statusHistory.length - 1] : undefined;
  }

  getEstimatedDeliveryFormatted(): string {
    if (!this.deliveryInfo.estimatedDeliveryDate) return 'Non défini';

    const date = new Date(this.deliveryInfo.estimatedDeliveryDate);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
