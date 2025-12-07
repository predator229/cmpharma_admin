import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../../controllers/services/auth.service";
import {
  PHARMACY_RESTRICTIONS,
  getRestrictionsByCategory,
  Category,
  getRestrictionByValue
} from "../../../../../../models/Category.class";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import {FormBuilder, FormGroup, FormsModule, Validators} from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CommonFunctions} from "../../../../../../controllers/comonsfunctions";
import {UserDetails} from "../../../../../../models/UserDatails";
import {environment} from "../../../../../../../environments/environment";
// import {Select2} from "ngx-select2-component";
import {FileClass} from "../../../../../../models/File.class";
import { Location } from '@angular/common';
import {ActivityTimelineComponent} from "../../../../sharedComponents/activity-timeline/activity-timeline.component";
import {ActivityLoged} from "../../../../../../models/Activity.class";
import {Select2} from "ng-select2-component";

@Component({
  selector: 'app-pharmacy-category-detail',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, ActivityTimelineComponent, Select2], //Select2
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})

export class PharmacyCategoryDetailComponent implements OnInit, OnDestroy {
  category: Category | null = null;
  categoryId: string = '';

  isLoading: boolean = false;
  errorMessage: string = '';

  internatPathUrl = environment.internalPathUrl;
  baseUrl = environment.baseUrl;

  permissions = {
    addCategorie: false,
    editCategorie: false,
    deleteCategorie: false,
    viewCategories: false,
    exportCategories: false,
  };

  categoryForm: FormGroup;
  isEditing: boolean = false;
  isSubmitting: boolean = false;

  categoriesListArray: { [p: string]: Category } = {};
  categoriesArraySelect2: Array<{value: string, label: string}> = [];
  pharmaciesListArray: Array<{value: string, label: string}> = [];
  restrictions = PHARMACY_RESTRICTIONS;
  usersInfo: { [key: string]:{  name: string;  img: string;  } } | null = null;

  selectedFiles: {
    iconUrl?: File;
    imageUrl?: File;
  } = {};
  previewUrls: {
    iconUrl?: string;
    imageUrl?: string;
  } = {};

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;
  userDetail: UserDetails;
  categoryActivities: ActivityLoged[] = [];

  @ViewChild('editCategoryModal') editCategoryModal: ElementRef | undefined;

  constructor(private route: ActivatedRoute, private router: Router, private location: Location, modalService: NgbModal, private auth: AuthService, private apiService: ApiService, private loadingService: LoadingService, private fb: FormBuilder) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
    this.modalService = modalService;
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.categoryId = params['id'];
        if (this.categoryId) {
          this.initializeComponent();
        } else {
          this.router.navigate(['/categories']);
        }
      });
  }

  private initializeComponent(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.permissions.viewCategories = this.userDetail.hasPermission('categories.view');
        this.permissions.addCategorie = this.userDetail.hasPermission('categories.create');
        this.permissions.editCategorie = this.userDetail.hasPermission('categories.edit');
        this.permissions.deleteCategorie = this.userDetail.hasPermission('categories.delete');
        this.permissions.exportCategories = this.userDetail.hasPermission('categories.export');

        if (loaded && this.userDetail && this.permissions.viewCategories) {
          await this.loadCategoryDetail();
          await this.loadFormData();
        } else {
          this.handleError('Vous n\'avez pas les permissions nécessaires pour voir cette page');
          this.router.navigate(['/categories']);
        }
      });
  }

  createForm(type : number): FormGroup {
    let formm = null;
    switch (type) {
      case 1:
        formm = this.fb.group({
          _id: [this.category._id],
          type_: [type],
          name: [this.category.name, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
          description: [this.category.description],
          slug: [this.category.slug, [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
          level: [this.category.level],
          parentCategory: [this.category.parentCategory?._id],
          status: [this.category.status, [Validators.required]],
          displayOrder: [this.category.displayOrder, [Validators.min(0)]],
          isVisible: [this.category.isVisible, [Validators.required]],
          metaTitle: [this.category.metaTitle],
          metaDescription: [this.category.metaDescription],
          keywords: [this.category.keywords.join(' , ')],
          requiresPrescription: [this.category.requiresPrescription],
          restrictions: [this.category.restrictions],
          specialCategory: [this.category.specialCategory, [Validators.required]],
        });
        break;
      case 2:
          formm = this.fb.group({
            _id: [this.category._id],
            type_: [type],
            pharmaciesList: [this.category.pharmaciesList.map(pharm => pharm.id), [Validators.required]]
          });
          break;
      case 3:
        formm = this.fb.group({
          _id: [this.category._id],
          type_: [type],
          iconUrl: [this.category.iconUrl],
        });
        break;
      case 4:
        formm = this.fb.group({
          _id: [this.category._id],
          type_: [type],
          imageUrl: [this.category.imageUrl],
        });
        break;
      default:
        formm = this.fb.group({
          _id: [this.category._id],
          type_: [type],
        });
        break;
    }
    return formm;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadCategorieActivities(categoryID: string): Promise<void> {
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

    this.apiService.post('pharmacy-management/categories/activities', { id: categoryID, uid }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.categoryActivities = response?.data || [];
          this.usersInfo = response?.usersMap || [];
        },
        error: (error) => {
          this.categoryActivities = [];
        }
      });
  }
  async loadCategoryDetail(): Promise<void> {
    this.loadingService.setLoading(true);
    this.errorMessage = '';

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

      this.apiService.post('pharmacy-management/categories/detail', {
        id: this.categoryId,
        uid
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.category = new Category(response.data);
              this.loadCategorieActivities(this.category._id);
            } else {
              this.handleError('Catégorie non trouvée');
              this.router.navigate(['/categories']);
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement de la catégorie');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  async loadFormData(): Promise<void> {
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
              this.categoriesListArray = response.catPerId ?? {};
              this.categoriesArraySelect2 = Object.keys(this.categoriesListArray || {})
                .filter(key => key !== this.categoryId)
                .map(key => ({
                  value: key,
                  label: this.categoriesListArray![key].name
                }));
              this.pharmaciesListArray = response.pharmaciesList ?? [];
            }
          },
          error: (error) => {
            console.error('Erreur lors du chargement des données du formulaire', error);
          }
        });
    } catch (error) {
      console.error('Erreur lors du chargement des données du formulaire', error);
    }
  }

  goBack(): void {
    this.location.back();
  }

  navigateToList(): void {
    this.router.navigate(['pharmacy/categories/list']);
  }

  openEditModal(type:number): void {
    if (!this.permissions.editCategorie) {
      this.handleError('Vous n\'avez pas la permission de modifier cette catégorie');
      return;
    }

    this.isEditing = true;
    this.categoryForm = this.createForm(type);

    setTimeout(() => {
      this.modalService.open(this.editCategoryModal, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }

  closeModal(): void {
    this.modalService.dismissAll('ok');
    this.isEditing = false;
    this.selectedFiles = {};
    this.previewUrls = {};
  }

  async onSubmit(): Promise<void> {
    if ( this.categoryForm.get('type_')?.value == 1 && (!this.categoryForm.get('parentCategory')?.value && this.categoryForm.get('level')?.value != 0)) {
      this.handleError("Vous devez sélectionner une catégorie parent pour le niveau choisi !");
      return;
    }

    if (this.categoryForm.get('type_')?.value == 2 && !this.categoryForm.get('pharmaciesList')?.value?.length) {
      this.handleError("Vous devez associer la catégorie à au moins une pharmacie !");
      return;
    }

    if (this.categoryForm.valid) {
      if (this.categoryForm.get('type_')?.value == 1) {
        this.categoryForm.patchValue({
          keywords: this.categoryForm.get('keywords')?.value?.toLowerCase()
            .split(',')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0)
        });
      }

      const formData = {
        ...this.categoryForm.value,
        _id: this.categoryId,
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

        if ([1,2].includes(formData.type_)) {
          this.apiService.post('pharmacy-management/categories/update', formData, headers)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: async (response: any) => {
                if (response && !response.error && response.data) {
                  this.showSuccess(response.message ?? 'Catégorie mise à jour avec succès');
                  this.closeModal();
                  this.loadCategoryDetail(); // Recharger les données
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
        }else{
          if (this.selectedFiles.iconUrl) {
            this.loadingService.setLoading(true);
            await this.uploadFiles(this.selectedFiles.iconUrl, 'iconUrl', this.categoryId);
            this.loadingService.setLoading(false);
          }
          if (this.selectedFiles.imageUrl) {
            this.loadingService.setLoading(true);
            await this.uploadFiles(this.selectedFiles.imageUrl, 'imageUrl', this.categoryId);
            this.loadingService.setLoading(false);
          }
          this.loadCategoryDetail(); // Recharger les données
          this.showSuccess('Catégorie mise à jour avec succès');
          this.closeModal();
        }
      } catch (error) {
        this.handleError('Une erreur s\'est produite. Veuillez réessayer!');
        this.loadingService.setLoading(false);
      }
    } else {
      this.handleError("Veuillez remplir tous les champs obligatoires !");
    }
  }

  async deleteCategory(): Promise<void> {
    if (!this.permissions.deleteCategorie) {
      this.handleError('Vous n\'avez pas la permission de supprimer cette catégorie');
      return;
    }

    if (!this.category) return;
    try {
      const confirmed = await this.showConfirmation(
        'Supprimer la catégorie',
        `Êtes-vous sûr de vouloir supprimer la catégorie "${this.category.name}" ? Cette action est irréversible.`,
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

      this.apiService.post('pharmacy-management/categories/delete', {
        _id: this.categoryId,
        uid
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.showSuccess('Catégorie supprimée avec succès');
            this.router.navigate(['pharmacy/categories/list']);
          },
          error: (error) => {
            this.handleError('Erreur lors de la suppression de la catégorie');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  // Helper methods
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

  // Form validation helpers
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

  // File handling
  onFileSelected(event: any, fileType: string): void {
    const file = event.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        this.handleError('Type de fichier non autorisé. Utilisez JPG, PNG ou JPEG.');
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

  removeFile(fileType: string): void {
    delete this.selectedFiles[fileType as keyof typeof this.selectedFiles];
    delete this.previewUrls[fileType as keyof typeof this.previewUrls];
    this.categoryForm.patchValue({
      [`${fileType}`]: null
    });

    const fileInput = document.getElementById(`${fileType}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getFileIcon(fileType: string): string {
    return 'fa fa-file-image';
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

  // Alert helpers
  private handleError(message: string): void {
    this.errorMessage = message;
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
  onRestrictionChange(event: any): void {
    const restrictions = this.categoryForm.get('restrictions')?.value || [];
    if (event.target.checked) {
      restrictions.push(event.target.value);
    } else {
      const index = restrictions.indexOf(event.target.value);
      if (index > -1) {
        restrictions.splice(index, 1);
      }
    }
    this.categoryForm.patchValue({ restrictions });
  }

  protected readonly getRestrictionByValue = getRestrictionByValue;
}
