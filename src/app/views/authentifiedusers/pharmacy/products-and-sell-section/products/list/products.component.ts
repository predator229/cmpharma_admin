import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../../controllers/services/auth.service";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CommonFunctions } from "../../../../../../controllers/comonsfunctions";
import { UserDetails } from "../../../../../../models/UserDatails";
import { environment } from "../../../../../../../environments/environment";
import { Select2 } from "ng-select2-component";
import { FileClass } from "../../../../../../models/File.class";
import { Category } from "../../../../../../models/Category.class";
import {Product} from "../../../../../../models/Product";

@Component({
  selector: 'app-pharmacy-product-list',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, Select2],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class PharmacyProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;

  searchText: string = '';
  categoryFilter: string = '';
  pharmacyFilter: string = '';
  statusFilter: string = '';
  prescriptionFilter: string = '';
  sortColumn: string = 'name';
  sortDirection: string = 'asc';

  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginationStart: number = 0;
  paginationEnd: number = 0;
  currentPage: number = 1;
  internatPathUrl = environment.internalPathUrl;

  permissions = {
    addProduct: false,
    editProduct: false,
    deleteProduct: false,
    viewProducts: false,
    exportProducts: false,
  };

  categories: Category[] = [];
  categoriesArraySelect2: Array<{value: string, label: string}> = [];
  pharmaciesListArray: Array<{value: string, label: string}> = [];

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

  productForm: FormGroup;
  isSubmitting: boolean = false;
  isLoading: boolean = false;

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;

  @ViewChild('productDetailsModal') productDetailsModal: ElementRef | undefined;
  @ViewChild('addEditProductModal') addEditProductModal: ElementRef | undefined;
  @ViewChild('importProductsModal') importProductsModal: ElementRef | undefined;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;

  importFile: File | null = null;
  importPreview: Array<{data: any, errors: string[]}> = [];
  importStats = { total: 0, valid: 0, errors: 0 };
  isImporting: boolean = false;

  selectedFiles: {
    mainImage?: File;
    images?: File[];
  } = {};
  previewUrls: {
    mainImage?: string;
    images?: string[];
  } = {};

  constructor(
    modalService: NgbModal,
    private auth: AuthService,
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
    this.modalService = modalService;
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.permissions.viewProducts = this.userDetail.hasPermission('produits.view');
        this.permissions.addProduct = this.userDetail.hasPermission('produits.create');
        this.permissions.editProduct = this.userDetail.hasPermission('produits.edit');
        this.permissions.deleteProduct = this.userDetail.hasPermission('produits.delete');
        this.permissions.exportProducts = this.userDetail.hasPermission('produits.export');

        if (loaded && this.userDetail) {
          await this.loadProducts();
          await this.loadCategories();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description: [''],
      shortDescription: [''],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      categories: [[], [Validators.required]],
      barcode: [''],
      sku: ['', [Validators.required]],
      cipCode: [''],
      laboratoire: [''],
      marque: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      originalPrice: [0],
      cost: [0],
      status: ['active', [Validators.required]],
      isVisible: [true],
      isFeatured: [false],
      isOnSale: [false],
      mainImage: [null],
      images: [[]],
      requiresPrescription: [false],
      prescriptionType: ['none'],
      drugForm: [''],
      dosage: [''],
      packaging: [''],
      activeIngredients: [[]],
      ageRestrictionMinAge: [null],
      ageRestrictionMaxAge: [null],
      contraindications: [[]],
      sideEffects: [[]],
      warnings: [[]],
      therapeuticClass: [''],
      pharmacologicalClass: [''],
      indicationsTherapeutiques: [[]],
      weight: [0],
      metaTitle: [''],
      metaDescription: [''],
      keywords: [[]],
      instructions: [''],
      storage: [''],
      origin: [''],
      pharmacies: [[], [Validators.required]],
      isFragile: [false],
      requiresColdChain: [false]
    });
  }

  get canImport(): boolean {
    return this.importFile !== null && this.importStats.valid > 0;
  }

  async loadProducts(): Promise<void> {
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

      this.apiService.post('pharmacy-management/products/list', { uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.products = response.data.map((item: any) => new Product(item));
              this.filterProducts();
              this.pharmaciesListArray = response.pharmaciesList ?? [];
            } else {
              this.products = [];
              this.filterProducts();
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des produits');
            this.loadingService.setLoading(false);
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

  filterProducts(): void {
    let filtered = [...this.products];

    if (this.searchText) {
      const searchTerms = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchTerms) ||
        p.description?.toLowerCase().includes(searchTerms) ||
        p.slug?.toLowerCase().includes(searchTerms) ||
        p.sku?.toLowerCase().includes(searchTerms) ||
        p.barcode?.toLowerCase().includes(searchTerms) ||
        p.laboratoire?.toLowerCase().includes(searchTerms) ||
        p.marque?.toLowerCase().includes(searchTerms) ||
        p.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerms))
      );
    }

    if (this.categoryFilter) {
      filtered = filtered.filter(p =>
        p.categories.some(cat => cat._id === this.categoryFilter)
      );
    }

    if (this.pharmacyFilter) {
      filtered = filtered.filter(p =>
        p.pharmacies.some(pharmacy => pharmacy.pharmacy.id === this.pharmacyFilter)
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    if (this.prescriptionFilter) {
      if (this.prescriptionFilter === 'required') {
        filtered = filtered.filter(p => p.requiresPrescription);
      } else if (this.prescriptionFilter === 'not_required') {
        filtered = filtered.filter(p => !p.requiresPrescription);
      }
    }

    filtered = this.sortProducts(filtered);

    this.filteredProducts = filtered;
    this.totalPages = Math.max(1, Math.ceil(this.filteredProducts.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updatePaginationInfo();
  }

  sortProducts(products: Product[]): Product[] {
    return products.sort((a, b) => {
      let aValue: any = this.getPropertyValue(a, this.sortColumn);
      let bValue: any = this.getPropertyValue(b, this.sortColumn);

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (this.sortColumn === 'createdAt' || this.sortColumn === 'updatedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
      } else {
        return aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
      }
    });
  }

  getPropertyValue(obj: any, path: string): any {
    const keys = path.split('.');
    return keys.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : null, obj);
  }

  updatePaginationInfo(): void {
    this.paginationStart = (this.currentPage - 1) * this.itemsPerPage;
    this.paginationEnd = Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredProducts.length
    );
  }

  pageChanged(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginationInfo();
    }
  }

  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filterProducts();
  }

  exportProductsList(): void {
    try {
      const headers = [
        'Nom', 'SKU', 'Prix', 'Statut', 'Laboratoire', 'Marque',
        'Ordonnance requise', 'Stock', 'Créé le'
      ];

      let csvContent = headers.join(',') + '\n';

      this.filteredProducts.forEach(product => {
        const row = [
          this.escapeCsvValue(product.name),
          this.escapeCsvValue(product.sku),
          product.price.toString(),
          this.escapeCsvValue(this.getStatusLabel(product.status)),
          this.escapeCsvValue(product.laboratoire || ''),
          this.escapeCsvValue(product.marque || ''),
          product.requiresPrescription ? 'Oui' : 'Non',
          product.status === 'out_of_stock' ? 'Épuisé' : 'Disponible',
          this.escapeCsvValue(product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '')
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.handleError('Erreur lors de l\'exportation des données');
    }
  }

  escapeCsvValue(value: string): string {
    if (!value) return '""';
    value = value.replace(/"/g, '""');
    return `"${value}"`;
  }

  viewProductDetails(product: Product): void {
    this.modalService.dismissAll('ok');
    if (product) {
      this.selectedProduct = product;
      setTimeout(() => {
        this.modalService.open(this.productDetailsModal, {
          size: 'xl',
          backdrop: 'static',
          centered: true
        });
      }, 0);
    }
  }

  openCreateModal(): void {
    this.productForm = this.createForm();
    this.productForm.patchValue({
      status: 'active',
      isVisible: true,
      requiresPrescription: false,
      prescriptionType: 'none',
      pharmacies: this.pharmaciesListArray.map(pharm => pharm.value)
    });
    this.modalService.dismissAll('ok');
    setTimeout(() => {
      this.modalService.open(this.addEditProductModal, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }

  openImportModal(): void {
    this.resetImportData();
    this.modalService.dismissAll('ok');
    setTimeout(() => {
      this.modalService.open(this.importProductsModal, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }

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

  async deleteProduct(product: Product): Promise<void> {
    try {
      const confirmed = await this.showConfirmation(
        'Supprimer le produit',
        `Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ? Cette action est irréversible.`,
        'Supprimer'
      );

      if (!confirmed) return;

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

      this.apiService.post('pharmacy-management/products/delete', { id: product._id, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            const index = this.products.findIndex(p => p._id === product._id);
            if (index > -1) {
              this.products.splice(index, 1);
              this.filterProducts();
              this.showSuccess('Produit supprimé avec succès');
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

  closeModal(): void {
    this.modalService.dismissAll('ok');
  }

  async onSubmit(): Promise<void> {
    if (!this.productForm.get('categories')?.value?.length) {
      this.handleError("Vous devez sélectionner au moins une catégorie !");
      return;
    }
    if (!this.productForm.get('pharmacies')?.value?.length) {
      this.handleError("Vous devez associer le produit à au moins une pharmacie !");
      return;
    }

    if (this.productForm.valid) {
      const formData = {
        ...this.productForm.value,
        uid: await this.auth.getUid(),
        ageRestriction: {
          minAge: this.productForm.get('ageRestrictionMinAge')?.value || null,
          maxAge: this.productForm.get('ageRestrictionMaxAge')?.value || null
        },
        deliveryInfo: {
          isFragile: this.productForm.get('isFragile')?.value || false,
          requiresColdChain: this.productForm.get('requiresColdChain')?.value || false
        }
      };

      // Remove temporary fields
      delete formData.ageRestrictionMinAge;
      delete formData.ageRestrictionMaxAge;
      delete formData.isFragile;
      delete formData.requiresColdChain;

      try {
        this.loadingService.setLoading(true);

        const token = await this.auth.getRealToken();
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });

        const endpoint = 'pharmacy-management/products/create';

        this.apiService.post(endpoint, formData, headers)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: async (response: any) => {
              if (response && !response.error && response.data) {
                if (this.selectedFiles.mainImage) {
                  await this.uploadFiles(this.selectedFiles.mainImage, 'mainImage', response.data._id);
                }
                if (this.selectedFiles.images && this.selectedFiles.images.length > 0) {
                  for (let i = 0; i < this.selectedFiles.images.length; i++) {
                    await this.uploadFiles(this.selectedFiles.images[i], `images_${i}`, response.data._id);
                  }
                }

                this.showSuccess(response.message ?? 'Produit créé avec succès');
                this.closeModal();
                this.productForm.reset();
                this.loadProducts();
              } else {
                this.handleError(response.errorMessage ?? 'Erreur lors de la sauvegarde');
              }
              this.loadingService.setLoading(false);
            },
            error: (error) => {
              this.handleError('Erreur lors de la communication avec le serveur');
              this.loadingService.setLoading(false);
            }
          });
      } catch (error) {
        this.handleError('Une erreur s\'est produite. Veuillez réessayer!');
        this.loadingService.setLoading(false);
      }
    } else {
      this.handleError("Veuillez remplir tous les champs obligatoires !");
    }
  }

  generateSlug(): void {
    const name = this.productForm.get('name')?.value;
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      this.productForm.patchValue({ slug });
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.productForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'Ce champ est obligatoire';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      if (control.errors['pattern']) return 'Format invalide (lettres, chiffres et tirets uniquement)';
      if (control.errors['min']) return `Valeur minimale: ${control.errors['min'].min}`;
    }
    return '';
  }

  isFieldValid(fieldName: string): boolean {
    const control = this.productForm.get(fieldName);
    return control ? control.valid && control.touched : false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.productForm.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  getPageNumbers(): number[] {
    const result: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        result.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        result.push(i);
      }
    }

    return result;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }

  getPaginatedProducts(): Product[] {
    const start = this.permissions.viewProducts ? this.paginationStart : 0;
    const end = this.permissions.viewProducts ? this.paginationEnd : 0;
    return this.filteredProducts.slice(start, end);
  }

  getFileIcon(fileType: string): string {
    return 'fa fa-file-image';
  }

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

  private async uploadFiles(file: File, fileType: string, productId: string): Promise<string> {
    let idFile: string = '';
    const token = await this.auth.getRealToken();
    const uid = await this.auth.getUid();
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type_', fileType);
      formData.append('productId', productId);
      formData.append('uid', uid || '');

      try {
        const response: any = await this.apiService.post('pharmacy-management/products/upload-images', formData, headers).toPromise();
        if (response && response.success) {
          idFile = response.data.fileId;
        }
      } catch (error) {
        throw new Error(`Erreur lors de l'upload du fichier ${fileType}`);
      }
    }
    return idFile;
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

    const fileInput = document.getElementById(fileType) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Import functionality
  resetImportData(): void {
    this.importFile = null;
    this.importPreview = [];
    this.importStats = { total: 0, valid: 0, errors: 0 };
    this.isImporting = false;
  }

  onImportFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        this.handleError('Veuillez sélectionner un fichier CSV.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.handleError('La taille du fichier ne peut pas dépasser 10MB.');
        return;
      }

      this.importFile = file;
      this.parseCSVFile(file);
    }
  }

  parseCSVFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const csv = e.target.result;
      const lines = csv.split('\n').filter((line: string) => line.trim() !== '');

      if (lines.length < 2) {
        this.handleError('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données.');
        return;
      }

      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));

      this.importPreview = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        const rowData = this.mapCSVRowToProduct(headers, values);
        const errors = this.validateImportRow(rowData);

        this.importPreview.push({
          data: rowData,
          errors: errors
        });
      }

      this.updateImportStats();
    };

    reader.onerror = () => {
      this.handleError('Erreur lors de la lecture du fichier.');
    };

    reader.readAsText(file);
  }

  parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  mapCSVRowToProduct(headers: string[], values: string[]): any {
    const data: any = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      const cleanValue = value.replace(/"/g, '').trim();

      switch (header.toLowerCase()) {
        case 'nom':
          data.name = cleanValue;
          break;
        case 'description':
          data.description = cleanValue;
          break;
        case 'sku':
          data.sku = cleanValue;
          break;
        case 'prix':
          data.price = parseFloat(cleanValue) || 0;
          break;
        case 'laboratoire':
          data.laboratoire = cleanValue;
          break;
        case 'marque':
          data.marque = cleanValue;
          break;
        case 'statut':
          data.status = cleanValue || 'active';
          break;
        case 'ordonnance':
          data.requiresPrescription = cleanValue.toLowerCase() === 'oui' || cleanValue === '1';
          break;
        case 'forme':
          data.drugForm = cleanValue;
          break;
        case 'dosage':
          data.dosage = cleanValue;
          break;
      }
    });

    return data;
  }

  validateImportRow(data: any): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Le nom est obligatoire');
    }

    if (!data.sku || data.sku.trim() === '') {
      errors.push('Le SKU est obligatoire');
    }

    if (data.price < 0) {
      errors.push('Le prix ne peut pas être négatif');
    }

    if (!['active', 'inactive', 'deleted', 'out_of_stock', 'discontinued'].includes(data.status)) {
      errors.push('Statut invalide');
    }

    return errors;
  }

// Mise à jour des statistiques d'import
  updateImportStats(): void {
    this.importStats.total = this.importPreview.length;
    this.importStats.valid = this.importPreview.filter(item => item.errors.length === 0).length;
    this.importStats.errors = this.importStats.total - this.importStats.valid;
  }

// Traitement des résultats d'import du backend
  private processImportResults(response: any): void {
    const results = response.data?.results;

    if (!results) {
      this.handleError('Réponse invalide du serveur');
      return;
    }

    // Mise à jour des statistiques avec les résultats du backend
    this.importStats = {
      total: results.total,
      valid: results.success,
      errors: results.errors
    };

    // Mise à jour du preview avec les erreurs du backend
    if (results.errorDetails && results.errorDetails.length > 0) {
      results.errorDetails.forEach((error: any) => {
        const previewIndex = error.row - 1; // Les rows commencent à 1 dans le backend
        if (this.importPreview[previewIndex]) {
          // Ajouter l'erreur du backend si elle n'existe pas déjà
          const backendError = `Backend: ${error.error}`;
          if (!this.importPreview[previewIndex].errors.includes(backendError)) {
            this.importPreview[previewIndex].errors.push(backendError);
          }
        }
      });
    }

    // Affichage des résultats
    this.showImportResults(results);
  }

// Affichage détaillé des résultats d'import
  private showImportResults(results: any): void {
    const { total, success, errors, errorDetails } = results;

    if (success > 0 && errors === 0) {
      // Import 100% réussi
      Swal.fire({
        icon: 'success',
        title: 'Import réussi !',
        html: `
        <div class="import-success-details">
          <p><strong>${success} produit(s)</strong> importé(s) avec succès sur ${total}</p>
          <div class="success-stats">
            <div class="stat-item">
              <i class="fas fa-check-circle text-success"></i>
              <span>Tous les produits ont été créés</span>
            </div>
          </div>
        </div>
      `,
        confirmButtonText: 'Parfait !',
        timer: 3000,
        timerProgressBar: true
      });
    } else if (success > 0 && errors > 0) {
      // Import partiel
      const errorsList = errorDetails.map((error: any) =>
        `<li><strong>Ligne ${error.row}</strong> (${error.name}): ${error.error}</li>`
      ).join('');

      Swal.fire({
        icon: 'warning',
        title: 'Import partiellement réussi',
        html: `
        <div class="import-partial-details">
          <div class="import-summary">
            <div class="summary-stats">
              <div class="stat-success">
                <i class="fas fa-check-circle"></i>
                <span><strong>${success}</strong> réussis</span>
              </div>
              <div class="stat-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span><strong>${errors}</strong> erreurs</span>
              </div>
            </div>
          </div>

          <div class="error-details" style="margin-top: 15px;">
            <h6>Détail des erreurs :</h6>
            <ul style="text-align: left; max-height: 200px; overflow-y: auto;">
              ${errorsList}
            </ul>
          </div>

          <p style="margin-top: 10px;">
            <small>Les produits valides ont été importés. Corrigez les erreurs et relancez l'import si nécessaire.</small>
          </p>
        </div>
      `,
        confirmButtonText: 'Compris',
        width: '600px'
      });
    } else if (errors === total) {
      // Aucun import réussi
      const errorsList = errorDetails.map((error: any) =>
        `<li><strong>Ligne ${error.row}</strong> (${error.name}): ${error.error}</li>`
      ).join('');

      Swal.fire({
        icon: 'error',
        title: 'Échec de l\'import',
        html: `
        <div class="import-error-details">
          <p>Aucun produit n'a pu être importé sur les <strong>${total}</strong> tentés.</p>

          <div class="error-details" style="margin-top: 15px;">
            <h6>Détail des erreurs :</h6>
            <ul style="text-align: left; max-height: 250px; overflow-y: auto;">
              ${errorsList}
            </ul>
          </div>

          <p style="margin-top: 15px;">
            <small>Vérifiez votre fichier CSV et corrigez les erreurs avant de relancer l'import.</small>
          </p>
        </div>
      `,
        confirmButtonText: 'Corriger le fichier',
        width: '600px'
      });
    }
  }

// Processus d'import amélioré
  async processImport(): Promise<void> {
    if (!this.canImport) {
      this.handleError('Aucune donnée valide à importer.');
      return;
    }

    this.isImporting = true;

    try {
      const validItems = this.importPreview.filter(item => item.errors.length === 0);
      const productsToImport = validItems.map(item => {
        const product = { ...item.data };

        // Génération automatique du slug si manquant
        if (!product.slug && product.name) {
          product.slug = product.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        }

        // Assignation des valeurs par défaut
        product.categories = this.categoriesArraySelect2.length > 0 ? [this.categoriesArraySelect2[0].value] : [];
        product.pharmacies = this.pharmaciesListArray.map(pharm => pharm.value);
        product.isVisible = true;
        product.isFeatured = false;
        product.isOnSale = false;
        product.prescriptionType = product.requiresPrescription ? 'simple' : 'none';

        return product;
      });

      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à effectuer cette action');
        this.isImporting = false;
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const requestData = {
        products: productsToImport,
        uid: uid
      };

      // Affichage d'un loader pendant l'import
      const loadingAlert = Swal.fire({
        title: 'Import en cours...',
        html: `
        <div class="import-loading">
          <div class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
          </div>
          <p>Traitement de ${productsToImport.length} produit(s)</p>
          <div class="progress mt-2">
            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
          </div>
        </div>
      `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.apiService.post('pharmacy-management/products/import', requestData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            Swal.close(); // Fermer le loader

            if (response && response.data && response.data.results) {
              // Traitement des résultats détaillés
              this.processImportResults(response);

              // Fermeture du modal et rechargement si au moins un succès
              if (response.data.results.success > 0) {
                setTimeout(() => {
                  this.closeModal();
                  this.resetImportData();
                  this.loadProducts();
                }, 2000);
              }
            } else {
              this.handleError(response.errorMessage || response.message || 'Erreur lors de l\'importation');
            }
            this.isImporting = false;
          },
          error: (error) => {
            Swal.close(); // Fermer le loader
            console.error('Erreur d\'import:', error);

            let errorMessage = 'Erreur lors de l\'importation des produits';
            if (error.error && typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.message) {
              errorMessage = error.message;
            }

            this.handleError(errorMessage);
            this.isImporting = false;
          }
        });

    } catch (error) {
      Swal.close(); // Fermer le loader en cas d'exception
      console.error('Exception lors de l\'import:', error);
      this.handleError('Une erreur s\'est produite lors de l\'importation');
      this.isImporting = false;
    }
  }

  // Helper methods for arrays
  addActiveIngredient(): void {
    const ingredients = this.productForm.get('activeIngredients')?.value || [];
    ingredients.push({ name: '', dosage: '' });
    this.productForm.patchValue({ activeIngredients: ingredients });
  }

  removeActiveIngredient(index: number): void {
    const ingredients = this.productForm.get('activeIngredients')?.value || [];
    ingredients.splice(index, 1);
    this.productForm.patchValue({ activeIngredients: ingredients });
  }

  addContraindication(): void {
    const contraindications = this.productForm.get('contraindications')?.value || [];
    contraindications.push('');
    this.productForm.patchValue({ contraindications: contraindications });
  }

  removeContraindication(index: number): void {
    const contraindications = this.productForm.get('contraindications')?.value || [];
    contraindications.splice(index, 1);
    this.productForm.patchValue({ contraindications: contraindications });
  }

  addSideEffect(): void {
    const sideEffects = this.productForm.get('sideEffects')?.value || [];
    sideEffects.push('');
    this.productForm.patchValue({ sideEffects: sideEffects });
  }

  removeSideEffect(index: number): void {
    const sideEffects = this.productForm.get('sideEffects')?.value || [];
    sideEffects.splice(index, 1);
    this.productForm.patchValue({ sideEffects: sideEffects });
  }

  addWarning(): void {
    const warnings = this.productForm.get('warnings')?.value || [];
    warnings.push('');
    this.productForm.patchValue({ warnings: warnings });
  }

  removeWarning(index: number): void {
    const warnings = this.productForm.get('warnings')?.value || [];
    warnings.splice(index, 1);
    this.productForm.patchValue({ warnings: warnings });
  }

  addKeyword(): void {
    const keywords = this.productForm.get('keywords')?.value || [];
    keywords.push('');
    this.productForm.patchValue({ keywords: keywords });
  }

  removeKeyword(index: number): void {
    const keywords = this.productForm.get('keywords')?.value || [];
    keywords.splice(index, 1);
    this.productForm.patchValue({ keywords: keywords });
  }

  addIndication(): void {
    const indications = this.productForm.get('indicationsTherapeutiques')?.value || [];
    indications.push('');
    this.productForm.patchValue({ indicationsTherapeutiques: indications });
  }

  removeIndication(index: number): void {
    const indications = this.productForm.get('indicationsTherapeutiques')?.value || [];
    indications.splice(index, 1);
    this.productForm.patchValue({ indicationsTherapeutiques: indications });
  }

  protected readonly parseFloat = parseFloat;
}
