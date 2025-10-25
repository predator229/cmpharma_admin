import { FileClass } from './File.class';
import { PharmacyClass } from './Pharmacy.class';
import { CommonFunctions } from '../controllers/comonsfunctions';
import {Category} from "./Category.class";
import {TaxeModel} from "./Taxe.class";

export class Product {
  _id?: string;

  name: string;
  description?: string;
  shortDescription?: string;
  slug: string;

  categories: Category[];

  barcode?: string;
  sku: string;
  cipCode?: string;
  laboratoire?: string;
  marque?: string;

  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  cost?: number;
  taxes: TaxeModel[];

  status: 'active' | 'inactive' | 'deleted' | 'out_of_stock' | 'discontinued';
  isVisible: boolean;
  isFeatured: boolean;
  isOnSale: boolean;

  images: FileClass[];
  mainImage?: FileClass;

  requiresPrescription: boolean;
  prescriptionType: 'none' | 'simple' | 'renewable' | 'restricted';
  drugForm?: string;
  dosage?: string;
  packaging?: string;
  activeIngredients: { name: string; dosage?: string }[];

  ageRestriction?: {
    minAge?: number;
    maxAge?: number;
  };

  contraindications: string[];
  sideEffects: string[];
  warnings: string[];

  therapeuticClass?: string;
  pharmacologicalClass?: string;
  indicationsTherapeutiques: string[];

  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  weight?: number;

  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];

  viewCount: number;
  salesCount: number;
  rating: number;
  reviewCount: number;

  manufacturingDate?: Date;
  expiryDate?: Date;
  launchDate?: Date;

  pharmacies: {
    pharmacy: PharmacyClass;
    price?: number;
    originalPrice?: number;
    discountPercentage?: number;
    cost?: number;
    isAvailable: boolean;
  }[];

  instructions?: string;
  storage?: string;
  origin?: string;

  relatedProducts: string[];
  alternatives: string[];

  promotions: {
    title: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }[];

  deliveryInfo?: {
    isFragile: boolean;
    requiresColdChain: boolean;
    maxDeliveryTime?: number;
    specialHandling?: string;
  };

  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;
    this.name = data.name || '';
    this.description = data.description;
    this.shortDescription = data.shortDescription;
    this.slug = data.slug || '';

    this.categories = data.categories;

    this.barcode = data.barcode;
    this.sku = data.sku || '';
    this.cipCode = data.cipCode;
    this.laboratoire = data.laboratoire;
    this.marque = data.marque;

    this.price = data.price || 0;
    this.originalPrice = data.originalPrice;
    this.discountPercentage = data.discountPercentage;
    this.cost = data.cost;
    this.taxes = data.taxes?.map((taxe) => new TaxeModel(taxe)) ?? [];

    this.status = data.status || 'active';
    this.isVisible = data.isVisible ?? true;
    this.isFeatured = data.isFeatured ?? false;
    this.isOnSale = data.isOnSale ?? false;

    this.images = (data.images || []).map((img: any) => new FileClass(img));
    this.mainImage = data.mainImage ? new FileClass(data.mainImage) : undefined;

    this.requiresPrescription = data.requiresPrescription ?? false;
    this.prescriptionType = data.prescriptionType || 'none';
    this.drugForm = data.drugForm;
    this.dosage = data.dosage;
    this.packaging = data.packaging;
    this.activeIngredients = data.activeIngredients || [];

    this.ageRestriction = data.ageRestriction || {};
    this.contraindications = data.contraindications || [];
    this.sideEffects = data.sideEffects || [];
    this.warnings = data.warnings || [];

    this.therapeuticClass = data.therapeuticClass;
    this.pharmacologicalClass = data.pharmacologicalClass;
    this.indicationsTherapeutiques = data.indicationsTherapeutiques || [];

    this.dimensions = data.dimensions || {};
    this.weight = data.weight;

    this.metaTitle = data.metaTitle;
    this.metaDescription = data.metaDescription;
    this.keywords = data.keywords || [];

    this.viewCount = data.viewCount || 0;
    this.salesCount = data.salesCount || 0;
    this.rating = data.rating || 0;
    this.reviewCount = data.reviewCount || 0;

    this.manufacturingDate = data.manufacturingDate ? new Date(data.manufacturingDate) : undefined;
    this.expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
    this.launchDate = data.launchDate ? new Date(data.launchDate) : new Date();

    this.pharmacies = (data.pharmacies || []).map((p: any) => ({
      pharmacy: CommonFunctions.mapToPharmacy(p.pharmacy),
      price: p.price ?? null,
      originalPrice : p.originalPrice ?? null,
      discountPercentage : p.discountPercentage ?? null,
      cost : p.cost ?? null,
      isAvailable: p.isAvailable ?? true
    }));

    this.instructions = data.instructions;
    this.storage = data.storage;
    this.origin = data.origin;

    this.relatedProducts = data.relatedProducts || [];
    this.alternatives = data.alternatives || [];

    this.promotions = data.promotions || [];

    this.deliveryInfo = data.deliveryInfo || {
      isFragile: false,
      requiresColdChain: false
    };

    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  isVisibleOnFrontend(): boolean {
    return this.isVisible && this.isActive();
  }

  getMainImageUrl(): string | null {
    return this.mainImage ? this.mainImage.url : null;
  }

  getFullName(): string {
    return this.name + (this.dosage ? ` - ${this.dosage}` : '');
  }

  isOnPromotion(): boolean {
    const now = new Date();
    return this.promotions.some(p => p.isActive && new Date(p.startDate) <= now && new Date(p.endDate) >= now);
  }

  getPromotionValue(): number {
    const now = new Date();
    const promo = this.promotions.find(p => p.isActive && new Date(p.startDate) <= now && new Date(p.endDate) >= now);
    return promo ? promo.discountValue : 0;
  }

  clone(updates: Partial<Product> = {}): Product {
    return new Product({ ...this, ...updates });
  }
}
