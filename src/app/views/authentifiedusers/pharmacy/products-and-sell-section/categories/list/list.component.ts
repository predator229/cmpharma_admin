import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../../controllers/services/auth.service";
import {
  PHARMACY_RESTRICTIONS,
  Category,
  getRestrictionByValue
} from "../../../../../../models/Category.class";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import {FormBuilder, FormGroup, FormsModule, Validators} from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UserDetails} from "../../../../../../models/UserDatails";
import {environment} from "../../../../../../../environments/environment";
import {Select2, Select2UpdateEvent, Select2UpdateValue} from "ng-select2-component";
import {take} from "rxjs/operators";
import {TaxeModel} from "../../../../../../models/Taxe.class";

@Component({
  selector: 'app-pharmacy-category-list',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, Select2], //Select2AjaxComponent
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})

export class PharmacyCategoryListComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  taxes: TaxeModel[] = [];
  filteredCategories: Category[] = [];
  selectedCategory: Category | null = null;

  searchText: string = '';
  levelFilter: string = '';
  pharmacyFilter: string = '';
  statusFilter: string = '';
  specialCategoryFilter: string = '';
  sortColumn: string = 'name';
  sortDirection: string = 'asc';

  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginationStart: number = 0;
  paginationEnd: number = 0;
  currentPage: number = 1;
  internatPathUrl = environment.internalPathUrl;
  permissions = {
    addCategorie: false,
    editCategorie: false,
    deleteCategorie: false,
    viewCategories: false,
    exportCategories: false,
  };
  restrictions = PHARMACY_RESTRICTIONS;
  levels: number[] = [];
  // specialCategories: string[] = ['otc', 'prescription', 'homeopathy', 'medical_device', 'supplement', 'cosmetic'];

  categoryForm: FormGroup;
  isSubmitting: boolean = false;

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;

  // Loading state
  isLoading: boolean = false;
  @ViewChild('categoryDetailsModal') categoryDetailsModal: ElementRef | undefined;
  @ViewChild('addEditCategoryModal') addEditCategoryModal: ElementRef | undefined;
  @ViewChild('importCategoriesModal') importCategoriesModal: ElementRef | undefined;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;
  categoriesListArray: { [p: string]: Category };
  categoriesArraySelect2: Array<{value: string, label: string}> = [];
  pharmaciesListArray: Array<{value: string, label: string}> = [];
  taxesArray: Array<{value: string, label: string}> = [];

  importFile: File | null = null;
  importPreview: Array<{data: any, errors: string[]}> = [];
  importStats = { total: 0, valid: 0, errors: 0 };
  isImporting: boolean = false;

  selectedFiles: { iconUrl?: File; imageUrl?: File; } = {};
  previewUrls: { iconUrl?: string; imageUrl?: string; } = {};

  constructor(modalService: NgbModal, private auth: AuthService, private router: Router, private apiService: ApiService, private loadingService: LoadingService, private fb: FormBuilder) {
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
        this.permissions.viewCategories = this.userDetail.hasPermission('categories.view');
        this.permissions.addCategorie = this.userDetail.hasPermission('categories.create');
        this.permissions.editCategorie = this.userDetail.hasPermission('categories.edit');
        this.permissions.deleteCategorie = this.userDetail.hasPermission('categories.delete');
        this.permissions.exportCategories = this.userDetail.hasPermission('categories.export');
        if (loaded && this.userDetail) {
          await this.loadTaxes();
          await this.loadCategories();
        }
      });
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: [''],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      parentCategory: [''],
      level: [0, [Validators.required, Validators.min(0)]],
      imageUrl:  [null],
      iconUrl:  [null],
      status: ['active', [Validators.required]],
      displayOrder: [0, [Validators.min(0)]],
      isVisible: [true],
      metaTitle: [''],
      metaDescription: [''],
      keywords: [[]],
      requiresPrescription: [false],
      restrictions: [[]],
      specialCategory: ['otc', [Validators.required]],
      taxesApplicable: [[]],
      pharmaciesList: [this.pharmaciesListArray.map(pharm => pharm.value), [Validators.required]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  get canImport(): boolean {
    return this.importFile !== null && this.importStats.valid > 0;
  }

  async loadTaxes(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      const token = await this.auth.getRealToken();
      const uid = this.auth.getUid();
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('pharmacy-management/taxes/list', { uid }, headers)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error && response.data) {
              this.taxes = response.data.map((t: any) => new TaxeModel(t));
              this.buildTaxesArray();
            } else {
              this.handleError(response?.errorMessage || 'Erreur lors du chargement des taxes');
            }
            this.isLoading = false;
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des catégories');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  private buildTaxesArray() {
    this.taxesArray = this.taxes.map((taxe) => ({
      value: taxe._id,
      label: taxe.name
    }));
  }

  async loadCategories(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      const token = await this.auth.getRealToken();
      const uid = this.auth.getUid();
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

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
              this.extractLevels();
              this.filterCategories();
              this.categoriesListArray = response.catPerId ?? [];
              this.categoriesArraySelect2 = Object.keys(this.categoriesListArray || {}).map(key => ({
                value: key,
                label: this.categoriesListArray![key].name
              }));
              this.pharmaciesListArray = response.pharmaciesList ?? [];
            } else {
              this.categories = [];
              this.filterCategories();
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des catégories');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  filterCategories(): void {
    let filtered = [...this.categories];

    if (this.searchText) {
      const searchTerms = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(searchTerms) ||
        c.description?.toLowerCase().includes(searchTerms) ||
        c.slug?.toLowerCase().includes(searchTerms) ||
        c.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerms))
      );
    }

    if (this.pharmacyFilter) {
      filtered = filtered.filter(c => c.pharmaciesList.filter((pharmacy) => { pharmacy.id == this.pharmacyFilter }));
    }
    if (this.levelFilter) {
      filtered = filtered.filter(c => c.level === parseInt(this.levelFilter));
    }

    if (this.statusFilter) {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }

    if (this.specialCategoryFilter) {
      filtered = filtered.filter(c => c.specialCategory === this.specialCategoryFilter);
    }

    filtered = this.sortCategories(filtered);

    this.filteredCategories = filtered;
    this.totalPages = Math.max(1, Math.ceil(this.filteredCategories.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updatePaginationInfo();
  }

  sortCategories(categories: Category[]): Category[] {
    return categories.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      aValue = this.getPropertyValue(a, this.sortColumn);
      bValue = this.getPropertyValue(b, this.sortColumn);

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
      this.filteredCategories.length
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
    this.filterCategories();
  }

  exportCategoriesList(): void {
    try {
      const headers = ['Nom', 'Slug', 'Niveau', 'Statut', 'Type spécial', 'Nb Produits', 'Créé le'];

      let csvContent = headers.join(',') + '\n';

      this.filteredCategories.forEach(category => {
        const row = [
          this.escapeCsvValue(category.name),
          this.escapeCsvValue(category.slug),
          category.level.toString(),
          this.escapeCsvValue(this.getStatusLabel(category.status)),
          this.escapeCsvValue(this.getSpecialCategoryLabel(category.specialCategory)),
          category.productCount.toString(),
          this.escapeCsvValue(category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '')
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `categories_${new Date().toISOString().split('T')[0]}.csv`);
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

  viewCategoryDetails(category: Category): void {
    this.modalService.dismissAll('ok');
    if (category) {
      this.selectedCategory = category;
      setTimeout(() => {
        this.modalService.open(this.categoryDetailsModal, {
          size: 'xl',
          backdrop: 'static',
          centered: true
        });
      }, 0);
    }
  }
  resetImportData(): void {
    this.importFile = null;
    this.importPreview = [];
    this.importStats = { total: 0, valid: 0, errors: 0 };
    this.isImporting = false;
  }

  openImportModal(): void {
    this.resetImportData();
    this.modalService.dismissAll('ok');
    setTimeout(() => {
      this.modalService.open(this.importCategoriesModal, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }

  openCreateModal(): void {
    this.categoryForm = this.createForm();
    this.categoryForm.patchValue({
      status: 'active',
      level: 0,
      displayOrder: 0,
      isVisible: true,
      requiresPrescription: false,
      specialCategory: 'otc'
    });
    this.modalService.dismissAll('ok');
    setTimeout(() => {
      this.modalService.open(this.addEditCategoryModal, {
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
      default: return 'Inconnu';
    }
  }

  getSpecialCategoryLabel(specialCategory: string): string {
    switch (specialCategory) {
      case 'otc': return 'Vente libre';
      case 'prescription': return 'Sur ordonnance';
      case 'homeopathy': return 'Homéopathie';
      case 'medical_device': return 'Dispositif médical';
      case 'supplement': return 'Complément alimentaire';
      case 'cosmetic': return 'Cosmétique';
      default: return 'Inconnu';
    }
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

  async deleteCategory(category: Category): Promise<void> {
    try {
      const confirmed = await this.showConfirmation(
        'Supprimer la catégorie',
        `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ? Cette action est irréversible.`,
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

      this.apiService.post('category-management/categories/delete', { id: category._id, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            const index = this.categories.findIndex(c => c._id === category._id);
            if (index > -1) {
              this.categories.splice(index, 1);
              this.filterCategories();
              this.showSuccess('Catégorie supprimée avec succès');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la suppression de la catégorie');
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
    if (!this.categoryForm.get('parentCategory').value && this.categoryForm.get('level').value == 1) {
      this.handleError("Vous devez selectionner une categorie parent pour le niveau choisi !");
      return;
    }
    if (!this.categoryForm.get('pharmaciesList').value) {
      this.handleError("Vous devez associer la categorie a au moins une pharmacie !");
      return;
    }
    if (this.categoryForm.valid) {
      const formData = {
        ...this.categoryForm.value,
        uid: await this.auth.getUid(),
      };

      try {
        this.loadingService.setLoading(true);

        const token = await this.auth.getRealToken();
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });

        const endpoint = 'pharmacy-management/categories/create';

        this.apiService.post(endpoint, formData, headers)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: async (response: any) => {
              if (response && !response.error && response.data) {
                if (this.categoryForm.get('iconUrl').value) {
                  await this.uploadFiles(this.categoryForm.get('iconUrl').value, 'iconUrl', response.data._id);
                }
                if (this.categoryForm.get('imageUrl').value) {
                  await this.uploadFiles(this.categoryForm.get('imageUrl').value, 'imageUrl', response.data._id);
                }

                this.showSuccess(response.message ?? 'Catégorie créée avec succès');
                this.closeModal();
                this.categoryForm.reset();
                this.loadCategories();
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
    const name = this.categoryForm.get('name')?.value;
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      this.categoryForm.patchValue({ slug });
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.categoryForm.get(fieldName);
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
    const control = this.categoryForm.get(fieldName);
    return control ? control.valid && control.touched : false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.categoryForm.get(fieldName);
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
  private extractLevels(): void {
    const levelSet = new Set<number>();
    this.categories.forEach(category => {
      levelSet.add(category.level);
    });
    this.levels = Array.from(levelSet).sort((a, b) => a - b);
  }

  getPaginatedCategories(): Category[] {
    const start = this.permissions.viewCategories ? this.paginationStart : 0;
    const end = this.permissions.viewCategories ? this.paginationEnd : 0;
    return this.filteredCategories.slice(start, end);
  }
  getFileIcon(fileType: string): string {
    return 'fa fa-file-image';
  }
  onFileSelected(event: any, fileType: string, type: number =0): void {
    const file = event.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        this.handleError('Type de fichier non autorisé. Utilisez PDF, JPG, PNG ou JPEG.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.handleError('La taille du fichier ne peut pas dépasser 5MB.');
        return;
      }
      this.selectedFiles[fileType as keyof typeof this.selectedFiles] = file;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls[fileType as keyof typeof this.previewUrls] = e.target.result;
        };
        reader.readAsDataURL(file);
      }

      this.categoryForm.patchValue({
        [`${fileType}`]: file
      });
    }
  }
  private async uploadFiles(file: File, fileType: string, categoryId: string): Promise<string> {
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
      formData.append('categoryId', categoryId);
      formData.append('uid', uid || '');
      try {
        const response: any = await this.apiService.post('pharmacy-management/pharmacies/upload-images-cat', formData, headers).toPromise();
        if (response && response.success) {
          idFile = response.data.fileId;
        }
      } catch (error) {
        throw new Error(`Erreur lors de l'upload du fichier ${fileType}`);
      }
    }
    return idFile;
  }

// Sélection du fichier d'import
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

// Parsing du fichier CSV
  parseCSVFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const csv = e.target.result;
      const lines = csv.split('\n').filter((line: string) => line.trim() !== '');

      if (lines.length < 2) {
        this.handleError('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données.');
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));

      // Parse data avec indicateur de progression
      this.importPreview = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        const rowData = this.mapCSVRowToCategory(headers, values);
        const errors = this.validateImportRow(rowData);

        this.importPreview.push({
          data: rowData,
          errors: errors
        });
      }

      this.updateImportStats();

      // Notification de fin de parsing
      if (this.importStats.valid > 0) {
        this.showSuccess(`Fichier analysé : ${this.importStats.valid} catégories valides sur ${this.importStats.total}`);
      } else if (this.importStats.errors === this.importStats.total) {
        this.handleError(`Aucune catégorie valide trouvée dans le fichier. Vérifiez le format et les données.`);
      }
    };

    reader.onerror = () => {
      this.handleError('Erreur lors de la lecture du fichier.');
    };

    reader.readAsText(file, 'UTF-8'); // Spécifier l'encodage
  }

// Parsing d'une ligne CSV (amélioré pour gérer les guillemets imbriqués)
  parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteCount = 0;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        quoteCount++;
        if (quoteCount % 2 === 1) {
          inQuotes = true;
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        quoteCount = 0;
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

// Mapping des données CSV vers objet catégorie
  mapCSVRowToCategory(headers: string[], values: string[]): any {
    const data: any = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      const cleanValue = value.replace(/^"|"$/g, '').trim(); // Retirer les guillemets de début/fin

      switch (header.toLowerCase()) {
        case 'nom':
          data.name = cleanValue;
          break;
        case 'description':
          data.description = cleanValue;
          break;
        case 'slug':
          data.slug = cleanValue;
          break;
        case 'niveau':
          data.level = parseInt(cleanValue) || 0;
          break;
        case 'catégorie parent':
        case 'categorie parent':
        case 'parent':
          data.parentCategoryName = cleanValue;
          break;
        case 'statut':
          data.status = cleanValue.toLowerCase() || 'active';
          break;
        case 'type spécial':
        case 'type special':
        case 'type':
          data.specialCategory = cleanValue.toLowerCase() || 'otc';
          break;
        case 'visible':
          data.isVisible = ['true', '1', 'oui', 'yes'].includes(cleanValue.toLowerCase());
          break;
        case 'ordre d\'affichage':
        case 'ordre affichage':
        case 'ordre':
          data.displayOrder = parseInt(cleanValue) || 0;
          break;
        case 'ordonnance requise':
        case 'ordonnance':
          data.requiresPrescription = ['true', '1', 'oui', 'yes'].includes(cleanValue.toLowerCase());
          break;
      }
    });

    return data;
  }

// Validation améliorée des données
  validateImportRow(data: any): string[] {
    const errors: string[] = [];

    // Validation du nom (obligatoire)
    if (!data.name || data.name.trim() === '') {
      errors.push('Le nom est obligatoire');
    } else if (data.name.length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    } else if (data.name.length > 100) {
      errors.push('Le nom ne peut pas dépasser 100 caractères');
    }

    // Validation du niveau
    if (![0, 1].includes(data.level)) {
      errors.push('Le niveau doit être 0 ou 1');
    }

    // Validation du statut
    if (!['active', 'inactive', 'deleted'].includes(data.status)) {
      errors.push('Le statut doit être: active, inactive ou deleted');
    }

    // Validation du type spécial
    const validTypes = ['otc', 'prescription', 'homeopathy', 'medical_device', 'supplement', 'cosmetic'];
    if (!validTypes.includes(data.specialCategory)) {
      errors.push(`Type spécial invalide. Valeurs acceptées: ${validTypes.join(', ')}`);
    }

    // Validation catégorie parent pour niveau 1
    if (data.level === 1 && (!data.parentCategoryName || data.parentCategoryName.trim() === '')) {
      errors.push('Une catégorie parent est requise pour le niveau 1');
    }

    // Validation ordre d'affichage
    if (data.displayOrder < 0) {
      errors.push('L\'ordre d\'affichage ne peut pas être négatif');
    }

    return errors;
  }

// Mise à jour des statistiques
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
          <p><strong>${success} catégorie(s)</strong> importée(s) avec succès sur ${total}</p>
          <div class="success-stats">
            <div class="stat-item">
              <i class="fas fa-check-circle text-success"></i>
              <span>Toutes les catégories ont été créées</span>
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
            <small>Les catégories valides ont été importées. Corrigez les erreurs et relancez l'import si nécessaire.</small>
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
          <p>Aucune catégorie n'a pu être importée sur les <strong>${total}</strong> tentées.</p>

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
      const categoriesToImport = validItems.map(item => {
        const category = { ...item.data };

        // Générer le slug si vide
        if (!category.slug && category.name) {
          category.slug = category.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        }

        // Trouver l'ID de la catégorie parent si nécessaire
        if (category.parentCategoryName && category.level === 1) {
          const parentCategory = this.categories.find(cat =>
            cat.name.toLowerCase() === category.parentCategoryName.toLowerCase()
          );
          if (parentCategory) {
            category.parentCategory = parentCategory._id;
          }
          delete category.parentCategoryName;
        }

        // Ajouter les champs par défaut
        category.pharmaciesList = this.pharmaciesListArray.map(pharm => pharm.value);
        category.restrictions = [];
        category.requiresPrescription = category.requiresPrescription || false;
        category.metaTitle = '';
        category.metaDescription = '';
        category.keywords = [];

        return category;
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
        categories: categoriesToImport,
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
          <p>Traitement de ${categoriesToImport.length} catégorie(s)</p>
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

      this.apiService.post('pharmacy-management/categories/import', requestData, headers)
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
                  this.loadCategories();
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

            let errorMessage = 'Erreur lors de l\'importation des catégories';
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

  removeFile(type:number, fileType: string): void {
    delete this.selectedFiles[fileType as keyof typeof this.selectedFiles];
    delete this.previewUrls[fileType as keyof typeof this.previewUrls];
    this.categoryForm.patchValue({
      [`${fileType}File`]: null
    });

    const fileInput = document.getElementById(`${fileType}File`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  protected readonly parseFloat = parseFloat;
  protected readonly getRestrictionByValue = getRestrictionByValue;

  onParentCategoryChange(updatedParent: Select2UpdateEvent<Select2UpdateValue>) {
    const categoryParent = this.categories.find(cat => cat._id === updatedParent.value);
    const taxesApplicable = Array.from(new Set([
      ...this.categoryForm.controls['taxesApplicable'].value,
      ...(categoryParent?.taxesApplicable.map((taxe) => taxe._id) || [])
    ]));
    this.categoryForm.patchValue({
      taxesApplicable: taxesApplicable
    });
  }
}
