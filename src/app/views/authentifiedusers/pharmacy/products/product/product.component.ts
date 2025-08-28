import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../controllers/services/auth.service";
import { Router, ActivatedRoute, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import {FormArray, FormBuilder, FormGroup, FormsModule, Validators} from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserDetails } from "../../../../../models/UserDatails";
import { environment } from "../../../../../../environments/environment";
import { Select2 } from "ng-select2-component";
import { Product } from "../../../../../models/Product";
import { Category } from "../../../../../models/Category.class";
import {ActivityTimelineComponent} from "../../../sharedComponents/activity-timeline/activity-timeline.component";
import {ActivityLoged} from "../../../../../models/Activity.class";
import {PharmacyClass} from "../../../../../models/Pharmacy.class";

@Component({
  selector: 'app-pharmacy-product-detail',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, Select2, ActivityTimelineComponent],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class PharmacyProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  productId: string = '';
  isLoading: boolean = false;
  isEditing: boolean = false;
  activeTab: string = 'general';

  // Edit forms for each section
  generalForm: FormGroup;
  productInfoForm: FormGroup;
  pricingForm: FormGroup;
  medicalForm: FormGroup;
  safetysForm: FormGroup;
  additionalForm: FormGroup;
  pharmaciesForm: FormGroup;

  permissions = {
    editProduct: false,
    deleteProduct: false,
    viewProducts: false,
  };

  categories: Category[] = [];
  categoriesArraySelect2: Array<{value: string, label: string}> = [];
  pharmaciesListArray: Array<{value: string, label: string}> = [];
  productsActivities: ActivityLoged[] = [];
  usersInfo: { [key: string]:{  name: string;  img: string;  } } | null = null;

  prescriptionTypes = [
    { value: 'none', label: 'Aucune' },
    { value: 'simple', label: 'Simple' },
    { value: 'renewable', label: 'Renouvelable' },
    { value: 'restricted', label: 'Restreinte' }
  ];

  drugForms = [
    { value: 'comprime', label: 'Comprimé' },
    { value: 'gelule', label: 'Gélule' },
    { value: 'sirop', label: 'Sirop' },
    { value: 'creme', label: 'Crème' },
    { value: 'pommade', label: 'Pommade' },
    { value: 'injection', label: 'Injection' },
    { value: 'gouttes', label: 'Gouttes' },
    { value: 'spray', label: 'Spray' },
    { value: 'sachet', label: 'Sachet' },
    { value: 'suppositoire', label: 'Suppositoire' }
  ];

  selectedFiles: {
    mainImage?: File;
    images?: File[];
  } = {};

  previewUrls: {
    mainImage?: string;
    images?: string[];
  } = {};

  private destroy$ = new Subject<void>();
  userDetail: UserDetails;
  internatPathUrl = environment.internalPathUrl;

  @ViewChild('editModal') editModal: ElementRef | undefined;
  // pharmacyGroup: FormArray;

  constructor(
    private modalService: NgbModal,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.initializeForms();

    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.productId = params['id'];
      }
    });

    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.permissions.viewProducts = this.userDetail.hasPermission('produits.view');
        this.permissions.editProduct = this.userDetail.hasPermission('produits.edit');
        this.permissions.deleteProduct = this.userDetail.hasPermission('produits.delete');

        if (loaded && this.userDetail && this.productId) {
          await this.loadProductDetail();
          await this.loadCategories();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms(): void {
    // Formulaire pour les informations générales
    this.generalForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description: [''],
      shortDescription: [''],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      categories: [[], [Validators.required]],
      status: ['active', [Validators.required]],
      isVisible: [true],
      isFeatured: [false],
      isOnSale: [false],
      metaTitle: [''],
      metaDescription: [''],
      keywords: [[]]
    });

    // Formulaire pour les informations produit
    this.productInfoForm = this.fb.group({
      barcode: [''],
      sku: ['', [Validators.required]],
      cipCode: [''],
      laboratoire: [''],
      marque: ['']
    });

    // Formulaire pour les prix
    this.pricingForm = this.fb.group({
      price: [0, [Validators.required, Validators.min(0)]],
      originalPrice: [0],
      cost: [0],
      pharmacyPricing: [[]],
    });

    // Formulaire pour les informations médicales
    this.medicalForm = this.fb.group({
      requiresPrescription: [false],
      prescriptionType: ['none'],
      drugForm: [''],
      dosage: [''],
      packaging: [''],
      activeIngredients: [[]],
      therapeuticClass: [''],
      pharmacologicalClass: [''],
      indicationsTherapeutiques: [[]],
      ageRestrictionMinAge: [null],
      ageRestrictionMaxAge: [null]
    });

    // Formulaire pour les informations de sécurité
    this.safetysForm = this.fb.group({
      contraindications: [[]],
      sideEffects: [[]],
      warnings: [[]]
    });

    // Formulaire pour les informations additionnelles
    this.additionalForm = this.fb.group({
      weight: [0],
      instructions: [''],
      storage: [''],
      origin: [''],
      isFragile: [false],
      requiresColdChain: [false]
    });

    // Formulaire pour les pharmacies
    this.pharmaciesForm = this.fb.group({
      pharmacies: [[], [Validators.required]]
    });
  }

  createPharmacyFormGroup(pharmacyData: {
    pharmacy: PharmacyClass;
    price?: number;
    originalPrice?: number;
    discountPercentage?: number;
    cost?: number;
    isAvailable: boolean;
  }): FormGroup {
    return this.fb.group({
      pharmacyId: [pharmacyData.pharmacy.id],
      pharmacyName: [pharmacyData.pharmacy.name],
      hasCustomPricing: [!!pharmacyData.price], // true si des prix spécifiques existent
      price: [pharmacyData.price, [Validators.min(0)]],
      originalPrice: [pharmacyData.originalPrice, [Validators.min(0)]],
      cost: [pharmacyData.cost, [Validators.min(0)]]
    });
  }

  async loadProductDetail(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('pharmacy-management/products/detail', { id: this.productId, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data && !response.error) {
              this.product = new Product(response.data);
              this.pharmaciesListArray = response.pharmaciesList ?? [];
              this.loadProductActivities(this.product._id);
              this.populateForms();
            } else {
              this.handleError('Produit non trouvé');
              this.router.navigate(['/pharmacy/products']);
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement du produit');
            this.loadingService.setLoading(false);
            this.router.navigate(['/pharmacy/products']);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();
      if (!token) return;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('pharmacy-management/categories/list', { uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.categories = response.data.map((item: any) => new Category(item));
              this.categoriesArraySelect2 = this.categories.map(cat => ({
                value: cat._id!,
                label: cat.name
              }));
            }
          },
          error: (error) => {
            console.error('Erreur lors du chargement des catégories', error);
          }
        });
    } catch (error) {
      console.error('Une erreur s\'est produite lors du chargement des catégories');
    }
  }

  populateForms(): void {
    if (!this.product) return;

    // Remplir le formulaire général
    this.generalForm.patchValue({
      name: this.product.name,
      description: this.product.description,
      shortDescription: this.product.shortDescription,
      slug: this.product.slug,
      categories: this.product.categories.map(cat => cat._id),
      status: this.product.status,
      isVisible: this.product.isVisible,
      isFeatured: this.product.isFeatured,
      isOnSale: this.product.isOnSale,
      metaTitle: this.product.metaTitle,
      metaDescription: this.product.metaDescription,
      keywords: this.product.keywords
    });

    // Remplir le formulaire produit
    this.productInfoForm.patchValue({
      barcode: this.product.barcode,
      sku: this.product.sku,
      cipCode: this.product.cipCode,
      laboratoire: this.product.laboratoire,
      marque: this.product.marque
    });

    // Remplir le formulaire prix
    this.pricingForm.patchValue({
      price: this.product.price,
      originalPrice: this.product.originalPrice,
      cost: this.product.cost,

      //damien
      pharmacyPricing: this.fb.array(
        this.product.pharmacies.map(pharmacy => this.createPharmacyFormGroup(pharmacy))
      )
    });

    // Remplir le formulaire médical
    this.medicalForm.patchValue({
      requiresPrescription: this.product.requiresPrescription,
      prescriptionType: this.product.prescriptionType,
      drugForm: this.product.drugForm,
      dosage: this.product.dosage,
      packaging: this.product.packaging,
      activeIngredients: this.product.activeIngredients,
      therapeuticClass: this.product.therapeuticClass,
      pharmacologicalClass: this.product.pharmacologicalClass,
      indicationsTherapeutiques: this.product.indicationsTherapeutiques,
      ageRestrictionMinAge: this.product.ageRestriction?.minAge,
      ageRestrictionMaxAge: this.product.ageRestriction?.maxAge
    });

    // Remplir le formulaire sécurité
    this.safetysForm.patchValue({
      contraindications: this.product.contraindications,
      sideEffects: this.product.sideEffects,
      warnings: this.product.warnings
    });

    // Remplir le formulaire additionnel
    this.additionalForm.patchValue({
      weight: this.product.weight,
      instructions: this.product.instructions,
      storage: this.product.storage,
      origin: this.product.origin,
      isFragile: this.product.deliveryInfo?.isFragile,
      requiresColdChain: this.product.deliveryInfo?.requiresColdChain
    });

    // Remplir le formulaire pharmacies
    this.pharmaciesForm.patchValue({
      pharmacies: this.product.pharmacies.map(p => p.pharmacy.id)
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateForms(); // Reset forms if canceling edit
    }
  }

  async updateSection(type: number): Promise<void> {
    let formData: any = {};
    let form: FormGroup;

    switch (type) {
      case 1: // General
        form = this.generalForm;
        formData = { ...form.value, type_: type, _id: this.productId };
        break;
      case 2: // Product Info
        form = this.productInfoForm;
        formData = { ...form.value, type_: type, _id: this.productId };
        break;
      case 3: // Pricing
        form = this.pricingForm;
        const pricingFormValue = form.value;
        formData = {
          ...pricingFormValue,
          type_: type,
          _id: this.productId,
          pharmacyPricing: pricingFormValue.pharmacyPricing.value || []
        };
        break;
      case 4: // Medical
        form = this.medicalForm;
        formData = {
          ...form.value,
          type_: type,
          _id: this.productId,
          ageRestrictionMinAge: form.get('ageRestrictionMinAge')?.value,
          ageRestrictionMaxAge: form.get('ageRestrictionMaxAge')?.value
        };
        break;
      case 5: // Safety
        form = this.safetysForm;
        formData = { ...form.value, type_: type, _id: this.productId };
        break;
      case 6: // Additional
        form = this.additionalForm;
        formData = {
          ...form.value,
          type_: type,
          _id: this.productId,
          isFragile: form.get('isFragile')?.value,
          requiresColdChain: form.get('requiresColdChain')?.value
        };
        break;
      case 7: // Pharmacies
        form = this.pharmaciesForm;
        formData = { ...form.value, type_: type, _id: this.productId };
        break;
      default:
        return;
    }

    if (!form.valid) {
      this.handleError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      this.loadingService.setLoading(true);
      const token = await this.auth.getRealToken();
      const uid = this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      formData.uid = uid;
      console.log(formData);

      this.apiService.post('pharmacy-management/products/update', formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log(response);
            if (response && !response.error) {
              this.product = new Product(response.data);
              this.showSuccess('Section mise à jour avec succès');
              this.populateForms();
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la mise à jour');
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors hhh de la communication avec le serveur');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  async deleteProduct(): Promise<void> {
    if (!this.product) return;

    const confirmed = await this.showConfirmation(
      'Supprimer le produit',
      `Êtes-vous sûr de vouloir supprimer le produit "${this.product.name}" ? Cette action est irréversible.`,
      'Supprimer'
    );

    if (!confirmed) return;

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('pharmacy-management/products/delete', { id: this.productId, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Produit supprimé avec succès');
              this.router.navigate(['/pharmacy/products']);
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la suppression');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la suppression du produit');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  generateSlug(): void {
    const name = this.generalForm.get('name')?.value;
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      this.generalForm.patchValue({ slug });
    }
  }

  // File upload methods
  onFileSelected(event: any, fileType: string): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (fileType === 'mainImage') {
        const file = files[0];
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          this.handleError('Type de fichier non autorisé. Utilisez JPG, PNG ou JPEG.');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.handleError('La taille du fichier ne peut pas dépasser 5MB.');
          return;
        }
        this.selectedFiles.mainImage = file;

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.mainImage = e.target.result;
        };
        reader.readAsDataURL(file);
      } else if (fileType === 'images') {
        const fileArray = Array.from(files) as File[];
        const validFiles: File[] = [];

        for (const file of fileArray) {
          if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            this.handleError(`Type de fichier non autorisé pour ${file.name}. Utilisez JPG, PNG ou JPEG.`);
            continue;
          }
          if (file.size > 5 * 1024 * 1024) {
            this.handleError(`La taille du fichier ${file.name} ne peut pas dépasser 5MB.`);
            continue;
          }
          validFiles.push(file);
        }

        this.selectedFiles.images = validFiles;
        this.previewUrls.images = [];

        validFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            if (!this.previewUrls.images) this.previewUrls.images = [];
            this.previewUrls.images.push(e.target.result);
          };
          reader.readAsDataURL(file);
        });
      }
    }
  }

  async uploadFile(fileType: string): Promise<void> {
    if (fileType === 'mainImage' && this.selectedFiles.mainImage) {
      await this.uploadFiles(this.selectedFiles.mainImage, 'mainImage', this.productId);
    } else if (fileType === 'images' && this.selectedFiles.images) {
      for (let i = 0; i < this.selectedFiles.images.length; i++) {
        await this.uploadFiles(this.selectedFiles.images[i], `images_${i}`, this.productId);
      }
    }
    this.loadProductDetail(); // Reload to show new images
  }

  private async uploadFiles(file: File, fileType: string, productId: string): Promise<string> {
    const token = await this.auth.getRealToken();
    const uid = await this.auth.getUid();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type_', fileType);
    formData.append('productId', productId);
    formData.append('uid', uid || '');

    try {
      const response: any = await this.apiService.post('pharmacy-management/products/upload-images', formData, headers).toPromise();
      if (response && response.success) {
        this.showSuccess('Image uploadée avec succès');
        return response.data.fileId;
      }
      throw new Error('Erreur lors de l\'upload');
    } catch (error) {
      this.handleError(`Erreur lors de l'upload du fichier ${fileType}`);
      throw error;
    }
  }

  removeFile(fileType: string, index?: number): void {
    if (fileType === 'mainImage') {
      delete this.selectedFiles.mainImage;
      delete this.previewUrls.mainImage;
    } else if (fileType === 'images' && index !== undefined) {
      if (this.selectedFiles.images) {
        this.selectedFiles.images.splice(index, 1);
      }
      if (this.previewUrls.images) {
        this.previewUrls.images.splice(index, 1);
      }
    }
  }

  // Array management methods
  addActiveIngredient(): void {
    const ingredients = this.medicalForm.get('activeIngredients')?.value || [];
    ingredients.push({ name: '', dosage: '' });
    this.medicalForm.patchValue({ activeIngredients: ingredients });
  }

  removeActiveIngredient(index: number): void {
    const ingredients = this.medicalForm.get('activeIngredients')?.value || [];
    ingredients.splice(index, 1);
    this.medicalForm.patchValue({ activeIngredients: ingredients });
  }

  addContraindication(): void {
    const contraindications = this.safetysForm.get('contraindications')?.value || [];
    contraindications.push('');
    this.safetysForm.patchValue({ contraindications: contraindications });
  }

  removeContraindication(index: number): void {
    const contraindications = this.safetysForm.get('contraindications')?.value || [];
    contraindications.splice(index, 1);
    this.safetysForm.patchValue({ contraindications: contraindications });
  }

  addSideEffect(): void {
    const sideEffects = this.safetysForm.get('sideEffects')?.value || [];
    sideEffects.push('');
    this.safetysForm.patchValue({ sideEffects: sideEffects });
  }

  removeSideEffect(index: number): void {
    const sideEffects = this.safetysForm.get('sideEffects')?.value || [];
    sideEffects.splice(index, 1);
    this.safetysForm.patchValue({ sideEffects: sideEffects });
  }

  addWarning(): void {
    const warnings = this.safetysForm.get('warnings')?.value || [];
    warnings.push('');
    this.safetysForm.patchValue({ warnings: warnings });
  }

  removeWarning(index: number): void {
    const warnings = this.safetysForm.get('warnings')?.value || [];
    warnings.splice(index, 1);
    this.safetysForm.patchValue({ warnings: warnings });
  }

  addKeyword(): void {
    const keywords = this.generalForm.get('keywords')?.value || [];
    keywords.push('');
    this.generalForm.patchValue({ keywords: keywords });
  }

  removeKeyword(index: number): void {
    const keywords = this.generalForm.get('keywords')?.value || [];
    keywords.splice(index, 1);
    this.generalForm.patchValue({ keywords: keywords });
  }

  addIndication(): void {
    const indications = this.medicalForm.get('indicationsTherapeutiques')?.value || [];
    indications.push('');
    this.medicalForm.patchValue({ indicationsTherapeutiques: indications });
  }

  removeIndication(index: number): void {
    const indications = this.medicalForm.get('indicationsTherapeutiques')?.value || [];
    indications.splice(index, 1);
    this.medicalForm.patchValue({ indicationsTherapeutiques: indications });
  }

  // Utility methods
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'deleted': return 'Supprimé';
      case 'out_of_stock': return 'Épuisé';
      case 'discontinued': return 'Discontinué';
      default: return 'Inconnu';
    }
  }

  getPrescriptionTypeLabel(type: string): string {
    const prescriptionType = this.prescriptionTypes.find(pt => pt.value === type);
    return prescriptionType ? prescriptionType.label : 'Inconnu';
  }

  getDrugFormLabel(form: string): string {
    const drugForm = this.drugForms.find(df => df.value === form);
    return drugForm ? drugForm.label : form;
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'Ce champ est obligatoire';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      if (control.errors['pattern']) return 'Format invalide';
      if (control.errors['min']) return `Valeur minimale: ${control.errors['min'].min}`;
    }
    return '';
  }

  isFieldValid(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return control ? control.valid && control.touched : false;
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  private async showConfirmation(title: string, text: string, confirmButtonText: string): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Annuler'
    });

    return result.isConfirmed;
  }

  private showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: message,
      timer: 2000,
      showConfirmButton: false
    });
  }

  goBack(): void {
    this.router.navigate(['/pharmacy/products/list']);
  }

  async loadProductActivities(productID: string): Promise<void> {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();
      if (!token) {
      this.handleError('Vous n\'êtes pas autorisé à effectuer cette action');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    this.apiService.post('pharmacy-management/products/activities', { id: productID, uid }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.productsActivities = response?.data || [];
          this.usersInfo = response?.usersMap || [];
        },
        error: (error) => {
          this.productsActivities = [];
        }
      });
  }

  get pharmacyPricingArray(): FormArray {
    return this.pricingForm.get('pharmacyPricing') as FormArray;
  }

  /**
   * Récupère les FormGroups des pharmacies pour *ngFor
   */
  getPharmacyFormGroups(): FormGroup[] {
    return this.pharmacyPricingArray.controls as FormGroup[];
  }

  /**
   * Récupère le nom d'une pharmacie par son index
   */
  getPharmacyName(index: number): string {
    return this.pharmacyPricingArray.at(index).get('pharmacyName')?.value || '';
  }

  /**
   * Gère le toggle des prix personnalisés pour une pharmacie
   */
  onCustomPricingToggle(index: number): void {
    const pharmacyGroup = this.pharmacyPricingArray.at(index) as FormGroup;
    const hasCustomPricing = pharmacyGroup.get('hasCustomPricing')?.value;

    if (!hasCustomPricing) {
      // Réinitialise les prix si on désactive les prix personnalisés
      pharmacyGroup.patchValue({
        price: null,
        originalPrice: null,
        cost: null
      });
    }
  }

  // ========== CALCULS POUR PRIX PAR DÉFAUT ==========

  /**
   * Vérifie s'il y a des calculs à afficher pour les prix par défaut
   */
  getDefaultPriceCalculations(): boolean {
    const price = this.pricingForm.get('price')?.value;
    const originalPrice = this.pricingForm.get('originalPrice')?.value;
    const cost = this.pricingForm.get('cost')?.value;

    return !!(price || originalPrice || cost);
  }

  /**
   * Calcule la marge bénéficiaire par défaut
   */
  getDefaultProfitMargin(): number | null {
    const price = this.pricingForm.get('price')?.value;
    const cost = this.pricingForm.get('cost')?.value;

    if (!price || !cost || cost === 0) {
      return null;
    }

    return ((price - cost) / cost) * 100;
  }
  getPharmacyProfitMargin(index: number): number | null {
    const pharmacyGroup = this.pharmacyPricingArray.at(index) as FormGroup;
    const price = pharmacyGroup.get('price')?.value;
    const cost = pharmacyGroup.get('cost')?.value;

    if (!price || !cost || cost === 0) {
      return null;
    }
    return ((price - cost) / cost) * 100;
  }
  getDefaultDiscount(): number | null {
    const originalPrice = this.pricingForm.get('originalPrice')?.value;
    const currentPrice = this.pricingForm.get('price')?.value;

    if (!originalPrice || !currentPrice) {
      return null;
    }

    return originalPrice - currentPrice;
  }
  getPharmacyDiscount(index: number): number | null {
    const pharmacyGroup = this.pharmacyPricingArray.at(index) as FormGroup;
    const originalPrice = pharmacyGroup.get('originalPrice')?.value;
    const currentPrice = pharmacyGroup.get('price')?.value;

    if (!originalPrice || !currentPrice) {
      return null;
    }
    return originalPrice - currentPrice;
  }

  getDefaultUnitProfit(): number | null {
    const price = this.pricingForm.get('price')?.value;
    const cost = this.pricingForm.get('cost')?.value;

    if (!price || !cost || cost === 0) {
      return null;
    }
    return (price - cost) ;
  }
  getPharmacyUnitProfit(index: number): number | null {
    const pharmacyGroup = this.pharmacyPricingArray.at(index) as FormGroup;
    const price = pharmacyGroup.get('price')?.value;
    const cost = pharmacyGroup.get('cost')?.value;

    if (!price || !cost || cost === 0) {
      return null;
    }
    return (price - cost) ;
  }
  getPharmacyCalculations(index: number): boolean {
    const pharmacyGroup = this.pharmacyPricingArray.at(index) as FormGroup;
    const price = pharmacyGroup.get('price')?.value;
    const originalPrice = pharmacyGroup.get('originalPrice')?.value;
    const cost = pharmacyGroup.get('cost')?.value;
    const hasCustomPricing = pharmacyGroup.get('hasCustomPricing')?.value;
    return !!(price || originalPrice || cost || hasCustomPricing);
  }
}
