import {PharmacyClass} from "./Pharmacy.class";
import {FileClass} from "./File.class";

export class Category {
  _id?: string;
  name: string;
  description?: string;
  slug: string;

  parentCategory?: Category | null;
  subcategories: Category[] | null;
  level: number;

  imageUrl?: FileClass;
  iconUrl?: FileClass;

  status: 'active' | 'inactive' | 'deleted';
  displayOrder: number;
  isVisible: boolean;

  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];

  productCount: number;
  viewCount: number;

  requiresPrescription: boolean;
  ageRestriction?: number;
  specialCategory: 'otc' | 'prescription' | 'homeopathy' | 'medical_device' | 'supplement' | 'cosmetic';

  pharmaciesList: [PharmacyClass];

  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    _id: string;
    name: string;
    description?: string;
    slug: string;
    parentCategory?: Category | null;
    subcategories?: Category[] | null;
    level?: number;
    imageUrl?: FileClass;
    iconUrl?: FileClass;
    status?: 'active' | 'inactive' | 'deleted';
    displayOrder?: number;
    isVisible?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    productCount?: number;
    viewCount?: number;
    requiresPrescription?: boolean;
    ageRestriction?: number;
    specialCategory?: 'otc' | 'prescription' | 'homeopathy' | 'medical_device' | 'supplement' | 'cosmetic';
    pharmaciesList: [PharmacyClass];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = data._id || '';
    this.name = data.name || '';
    this.description = data.description;
    this.slug = data.slug || '';

    this.parentCategory = data.parentCategory;
    this.subcategories = data.subcategories || [];
    this.level = data.level || 0;

    this.imageUrl = data.imageUrl;
    this.iconUrl = data.iconUrl;

    this.status = data.status || 'active';
    this.displayOrder = data.displayOrder || 0;
    this.isVisible = data.isVisible !== undefined ? data.isVisible : true;

    this.metaTitle = data.metaTitle;
    this.metaDescription = data.metaDescription;
    this.keywords = data.keywords || [];

    this.productCount = data.productCount || 0;
    this.viewCount = data.viewCount || 0;

    this.requiresPrescription = data.requiresPrescription || false;
    this.ageRestriction = data.ageRestriction;
    this.specialCategory = data.specialCategory || 'otc';

    this.pharmaciesList = data.pharmaciesList;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  imVisible(): boolean {
    return this.isVisible && this.isActive();
  }

  isRootCategory(): boolean {
    return !this.parentCategory && this.level === 0;
  }

  hasSubcategories(): boolean {
    return this.subcategories && this.subcategories.length > 0;
  }

  isPrescriptionRequired(): boolean {
    return this.requiresPrescription || this.specialCategory === 'prescription';
  }

  hasAgeRestriction(): boolean {
    return this.ageRestriction !== null && this.ageRestriction !== undefined;
  }

  getDisplayName(): string {
    return this.name;
  }

  getMetaTitle(): string {
    return this.metaTitle || this.name;
  }

  getMetaDescription(): string {
    return this.metaDescription || this.description || '';
  }

  incrementViewCount(): void {
    this.viewCount++;
  }

  updateProductCount(count: number): void {
    this.productCount = Math.max(0, count);
  }

  // Méthodes pour la gestion de la hiérarchie
  getFullPath(): string {
    // Cette méthode nécessiterait une logique pour remonter la hiérarchie
    // Elle pourrait être implémentée avec un service qui gère les catégories
    return this.slug;
  }

  getBreadcrumb(): string[] {
    // Retourne un tableau de slugs représentant le chemin complet
    // Implémentation dépendante du service de gestion des catégories
    return [this.slug];
  }

  isValidForProducts(): boolean {
    return this.isActive() && this.isVisible;
  }

  canHaveProducts(): boolean {
    // Les catégories de niveau profond peuvent généralement avoir des produits
    return this.level > 0 || !this.hasSubcategories();
  }

  toJson(): any {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      slug: this.slug,
      parentCategory: this.parentCategory,
      subcategories: this.subcategories,
      level: this.level,
      imageUrl: this.imageUrl,
      iconUrl: this.iconUrl,
      status: this.status,
      displayOrder: this.displayOrder,
      isVisible: this.isVisible,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      keywords: this.keywords,
      productCount: this.productCount,
      viewCount: this.viewCount,
      requiresPrescription: this.requiresPrescription,
      ageRestriction: this.ageRestriction,
      specialCategory: this.specialCategory,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  clone(updates: Partial<Category> = {}): Category {
    return new Category({
      ...this.toJson(),
      ...updates
    });
  }
}
