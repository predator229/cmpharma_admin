import {Product} from "./Product";
import {Category} from "./Category.class";
import {PharmacyClass} from "./Pharmacy.class";
import {CustomerClass} from "./Customer.class";

export class CouponClass {
  _id?: string;

  code: string;
  name: string;
  description?: string;

  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;

  minimumOrderAmount: number;
  maximumOrderAmount?: number;

  startDate: Date;
  endDate: Date;

  usageLimit?: number;
  usagePerClient: number;
  currentUsage: number;

  applicableProducts: Product[];
  applicableCategories: Category[];
  excludedProducts: Product[];
  applicablePharmacies: PharmacyClass[];

  status: 'active' | 'inactive' | 'expired';
  isPublic: boolean;

  eligibleClients: CustomerClass[];

  timesUsed: number;
  totalDiscountGiven: number;

  createdBy?: string;

  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;

    this.code = data.code || '';
    this.name = data.name || '';
    this.description = data.description;

    this.discountType = data.discountType || 'percentage';
    this.discountValue = data.discountValue || 0;
    this.maxDiscount = data.maxDiscount;

    this.minimumOrderAmount = data.minimumOrderAmount || 0;
    this.maximumOrderAmount = data.maximumOrderAmount;

    this.startDate = data.startDate ? new Date(data.startDate) : new Date();
    this.endDate = data.endDate ? new Date(data.endDate) : new Date();

    this.usageLimit = data.usageLimit;
    this.usagePerClient = data.usagePerClient || 1;
    this.currentUsage = data.currentUsage || 0;

    this.applicableProducts = (data.applicableProducts || []).map((product: any) => new Product(product));
    this.applicableCategories = (data.applicableCategories || []).map((category: any) => new Category(category));
    this.excludedProducts = (data.excludedProducts || []).map((product: any) => new Product(product));
    this.applicablePharmacies = (data.applicablePharmacies || []).map((pharmacy: any) => new PharmacyClass(pharmacy));

    this.status = data.status || 'active';
    this.isPublic = data.isPublic ?? true;

    this.eligibleClients = (data.eligibleClients || []).map((client: any) => new CustomerClass(client));

    this.timesUsed = data.timesUsed || 0;
    this.totalDiscountGiven = data.totalDiscountGiven || 0;

    this.createdBy = data.createdBy;

    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  getStatusLabel(): string {
    const statusLabels = {
      active: 'Actif',
      inactive: 'Inactif',
      expired: 'Expiré'
    };
    return statusLabels[this.status] || 'Inconnu';
  }

  getStatusBadgeClass(): string {
    const statusClasses = {
      active: 'bg-success',
      inactive: 'bg-secondary',
      expired: 'bg-danger'
    };
    return statusClasses[this.status] || 'bg-secondary';
  }

  isValid(): boolean {
    const now = new Date();
    return this.status === 'active' &&
      now >= this.startDate &&
      now <= this.endDate &&
      (!this.usageLimit || this.currentUsage < this.usageLimit);
  }

  isExpired(): boolean {
    return new Date() > this.endDate || this.status === 'expired';
  }

  getDaysUntilExpiry(): number {
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDiscountLabel(): string {
    if (this.discountType === 'percentage') {
      return `${this.discountValue}%`;
    } else {
      return `${this.discountValue}€`;
    }
  }

  getRemainingUses(): number | null {
    if (!this.usageLimit) return null;
    return Math.max(0, this.usageLimit - this.currentUsage);
  }

  getUsagePercentage(): number {
    if (!this.usageLimit) return 0;
    return (this.currentUsage / this.usageLimit) * 100;
  }

  canBeUsedBy(clientId: string): boolean {
    if (!this.isPublic) {
      return this.eligibleClients.some(client => client._id === clientId);
    }
    return true;
  }

  isApplicableToProduct(productId: string): boolean {
    // Si des produits spécifiques sont définis, vérifier l'inclusion
    if (this.applicableProducts.length > 0) {
      return this.applicableProducts.some(product => product._id === productId);
    }

    // Vérifier que le produit n'est pas exclu
    return !this.excludedProducts.some(product => product._id === productId);
  }

  isApplicableToPharmacy(pharmacyId: string): boolean {
    if (this.applicablePharmacies.length === 0) return true;
    return this.applicablePharmacies.some(pharmacy => pharmacy.id === pharmacyId);
  }

  calculateDiscount(orderAmount: number): number {
    if (!this.isValidForAmount(orderAmount)) return 0;

    if (this.discountType === 'percentage') {
      const discount = (orderAmount * this.discountValue) / 100;
      return this.maxDiscount ? Math.min(discount, this.maxDiscount) : discount;
    } else {
      return Math.min(this.discountValue, orderAmount);
    }
  }

  isValidForAmount(amount: number): boolean {
    if (amount < this.minimumOrderAmount) return false;
    if (this.maximumOrderAmount && amount > this.maximumOrderAmount) return false;
    return true;
  }
}
