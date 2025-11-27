import {PharmacyClass} from "./Pharmacy.class";
import {FileClass} from "./File.class";
import {CommonFunctions} from "../controllers/comonsfunctions";
import {TaxeModel} from "./Taxe.class";

interface PharmacyRestriction {
  value: string;
  label: string;
  category: string;
  description?: string;
}
export const getRestrictionsByCategory = (): any[] => {
  const groups: { [key: string]: PharmacyRestriction[] } = PHARMACY_RESTRICTIONS.reduce((groups, restriction) => {
    const category = restriction.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(restriction);
    return groups;
  }, {} as { [key: string]: PharmacyRestriction[] });

  return Object.keys(groups).map(category => ({
    text: category,
    children: groups[category].map(restriction => ({
      value: restriction.value,
      label: restriction.label
    }))
  }));
};
// Helper pour récupérer les labels des restrictions sélectionnées
export const getSelectedRestrictionLabels = (selectedValues: string[]): string[] => {
  return PHARMACY_RESTRICTIONS
    .filter(restriction => selectedValues.includes(restriction.value))
    .map(restriction => restriction.label);
};

// Helper pour récupérer une restriction par sa valeur
export const getRestrictionByValue = (value: string): PharmacyRestriction | undefined => {
  return PHARMACY_RESTRICTIONS.find(restriction => restriction.value === value);
};

// Types pour les valeurs de restrictions
export type RestrictionValue = typeof PHARMACY_RESTRICTIONS[number]['value'];
export type RestrictionCategory = typeof PHARMACY_RESTRICTIONS[number]['category'];
export const PHARMACY_RESTRICTIONS: PharmacyRestriction[] = [
  // Restrictions d'âge
  { value: 'age_18', label: '18 ans et plus', category: 'Restrictions d\'âge' },
  { value: 'age_16', label: '16 ans et plus', category: 'Restrictions d\'âge' },
  { value: 'age_12', label: '12 ans et plus', category: 'Restrictions d\'âge' },
  { value: 'minors_supervision', label: 'Mineurs sous supervision parentale', category: 'Restrictions d\'âge' },

  // Restrictions médicales
  { value: 'prescription_required', label: 'Ordonnance médicale obligatoire', category: 'Restrictions médicales' },
  { value: 'pharmacist_advice', label: 'Conseil du pharmacien requis', category: 'Restrictions médicales' },
  { value: 'medical_history', label: 'Vérification des antécédents médicaux', category: 'Restrictions médicales' },
  { value: 'contraindications_check', label: 'Vérification des contre-indications', category: 'Restrictions médicales' },
  { value: 'drug_interactions', label: 'Contrôle des interactions médicamenteuses', category: 'Restrictions médicales' },

  // Restrictions de quantité
  { value: 'quantity_limited', label: 'Quantité limitée par achat', category: 'Restrictions de quantité' },
  { value: 'monthly_limit', label: 'Limite mensuelle', category: 'Restrictions de quantité' },
  { value: 'one_per_person', label: 'Un seul par personne', category: 'Restrictions de quantité' },
  { value: 'bulk_restriction', label: 'Vente en gros interdite', category: 'Restrictions de quantité' },

  // Conditions de vente
  { value: 'id_required', label: 'Pièce d\'identité obligatoire', category: 'Conditions de vente' },
  { value: 'registration_required', label: 'Enregistrement client requis', category: 'Conditions de vente' },
  { value: 'pharmacist_presence', label: 'Présence du pharmacien obligatoire', category: 'Conditions de vente' },
  { value: 'consultation_required', label: 'Consultation préalable requise', category: 'Conditions de vente' },

  // Restrictions temporelles
  { value: 'daytime_only', label: 'Vente en journée uniquement', category: 'Restrictions temporelles' },
  { value: 'business_hours', label: 'Heures d\'ouverture strictes', category: 'Restrictions temporelles' },
  { value: 'no_weekend', label: 'Pas de vente le weekend', category: 'Restrictions temporelles' },
  { value: 'appointment_only', label: 'Sur rendez-vous uniquement', category: 'Restrictions temporelles' },

  // Restrictions spéciales
  { value: 'pregnancy_warning', label: 'Mise en garde grossesse', category: 'Restrictions spéciales' },
  { value: 'driving_warning', label: 'Avertissement conduite', category: 'Restrictions spéciales' },
  { value: 'alcohol_incompatible', label: 'Incompatible avec l\'alcool', category: 'Restrictions spéciales' },
  { value: 'professional_use', label: 'Usage professionnel uniquement', category: 'Restrictions spéciales' },
  { value: 'controlled_substance', label: 'Substance contrôlée', category: 'Restrictions spéciales' },
  { value: 'cold_chain', label: 'Chaîne du froid obligatoire', category: 'Restrictions spéciales' }
];

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
  restrictions?: string[];
  specialCategory: 'otc' | 'prescription' | 'homeopathy' | 'medical_device' | 'supplement' | 'cosmetic';

  pharmaciesList: PharmacyClass[];
  taxesApplicable: TaxeModel[];
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
    restrictions?: string[];
    specialCategory?: 'otc' | 'prescription' | 'homeopathy' | 'medical_device' | 'supplement' | 'cosmetic';
    pharmaciesList: Object[];
    createdAt: Date;
    updatedAt: Date;
    taxesApplicable?: TaxeModel[];
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
    this.restrictions = data.restrictions;
    this.specialCategory = data.specialCategory || 'otc';

    this.pharmaciesList = data.pharmaciesList.map((item: any) => CommonFunctions.mapToPharmacy(item));
    this.taxesApplicable = data.taxesApplicable?.map((taxe: any) => new TaxeModel(taxe)) ?? [];

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
      restrictions: this.restrictions,
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
