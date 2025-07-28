import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../controllers/services/auth.service";
import {
  PHARMACY_RESTRICTIONS,
  getRestrictionsByCategory,
  Category,
  getRestrictionByValue
} from "../../../../../models/Category.class";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import {FormBuilder, FormGroup, FormsModule, Validators} from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CommonFunctions} from "../../../../../controllers/comonsfunctions";
import {UserDetails} from "../../../../../models/UserDatails";
// import {Select2AjaxComponent} from "../../../sharedComponents/select2-ajax/select2-ajax.component";
import {environment} from "../../../../../../environments/environment";
import {Select2} from "ng-select2-component";
import {FileClass} from "../../../../../models/File.class";

@Component({
  selector: 'app-pharmacy-category-list',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, Select2], //Select2AjaxComponent
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})

export class PharmacyCategoryListComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
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

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;
  categoriesListArray: { [p: string]: Category };
  categoriesArraySelect2: Array<{value: string, label: string}> = [];
  pharmaciesListArray: Array<{value: string, label: string}> = [];

  selectedFiles: {
    iconUrl?: File;
    imageUrl?: File;
  } = {};
  previewUrls: {
    iconUrl?: string;
    imageUrl?: string;
  } = {};

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
          await this.loadCategories();
          this.categoryForm = this.createForm();
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
      pharmaciesList: [this.pharmaciesListArray.map(pharm=>pharm.value), [Validators.required]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadCategories(): Promise<void> {
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

  openCreateModal(): void {
    this.categoryForm.reset();
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
        const response: any = await this.apiService.post('pharmacy-managment/pharmacies/upload-images-cat', formData, headers).toPromise();
        if (response && response.success) {
          idFile = response.data.fileId;
        }
      } catch (error) {
        throw new Error(`Erreur lors de l'upload du fichier ${fileType}`);
      }
    }
    return idFile;
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
}
