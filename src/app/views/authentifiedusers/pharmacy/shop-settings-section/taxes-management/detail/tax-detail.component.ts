import { Component, OnInit, ViewChild, TemplateRef, inject, DestroyRef } from '@angular/core';
import { CommonModule, Location } from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import { HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import { ApplicableOn, Jurisdiction, TaxeModel, TaxType } from 'src/app/models/Taxe.class';
import { UserDetails } from "../../../../../../models/UserDatails";
import { environment } from "../../../../../../../environments/environment";
import { AuthService } from "../../../../../../controllers/services/auth.service";
import { ApiService } from "../../../../../../controllers/services/api.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { take } from "rxjs/operators";
import { Category } from 'src/app/models/Category.class';
import { Product } from "../../../../../../models/Product";
import {Select2} from "ng-select2-component";

interface TaxStatistics {
  totalProducts: number;
  totalCategories: number;
  activeProducts: number;
  inactiveProducts: number;
  estimatedMonthlyRevenue: number;
  estimatedMonthlyTaxAmount: number;
  averageProductPrice: number;
  productsWithMultipleTaxes: number;
}

interface TaxImpactAnalysis {
  productId: string;
  productName: string;
  beforeTax: number;
  taxAmount: number;
  afterTax: number;
  effectiveRate: number;
}

@Component({
  selector: 'app-pharmacy-tax-detail',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, Select2],
  templateUrl: './tax-detail.component.html',
  styleUrls: ['./tax-detail.component.scss']
})
export class PharmacyTaxDetailComponent implements OnInit {
  tax: TaxeModel | null = null;
  taxId: string = '';

  isLoading = false;
  isSubmitting = false;

  protected readonly Math = Math;
  internatPathUrl = environment.internalPathUrl;

  // Tabs
  activeTab: 'overview' | 'products' | 'categories' | 'statistics' | 'history' | 'settings' = 'overview';

  // Related entities (viennent du backend)
  affectedProducts: Product[] = [];
  affectedCategories: Category[] = [];
  filteredProducts: Product[] = [];
  filteredCategories: Category[] = [];
  defaultApplicableOnList: Array<{value: string, label: string}> = [];

  // Statistics (viennent du backend)
  statistics: TaxStatistics = {
    totalProducts: 0,
    totalCategories: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    estimatedMonthlyRevenue: 0,
    estimatedMonthlyTaxAmount: 0,
    averageProductPrice: 0,
    productsWithMultipleTaxes: 0
  };

  // Impact analysis (vient du backend)
  impactAnalysis: TaxImpactAnalysis[] = [];

  // Search and filters
  productSearchTerm = '';
  categorySearchTerm = '';
  productStatusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Pagination
  productsPage = 1;
  productsPerPage = 10;
  categoriesPage = 1;
  categoriesPerPage = 10;

  // Forms
  rateForm: FormGroup;
  taxEditForm: FormGroup;
  taxProductForm: FormGroup;

  // Permissions
  permissions = {
    viewTax: false,
    editTax: false,
    deleteTax: false,
    manageTaxRates: false,
    viewProducts: false,
    viewStatistics: false
  };

  // Constants
  TAX_TYPES: { value: TaxType; label: string }[] = [
    { value: 'percentage', label: 'Pourcentage' },
    { value: 'fixed', label: 'Montant fixe' }
  ];

  JURISDICTIONS: { value: Jurisdiction; label: string }[] = [
    { value: 'national', label: 'National' },
    { value: 'regional', label: 'Régional' },
    { value: 'municipal', label: 'Municipal' }
  ];

  APPLICABLE_ON: { value: ApplicableOn; label: string }[] = [
    // { value: 'all', label: 'Tous les produits' },
    { value: 'category', label: 'Par catégorie' },
    { value: 'product', label: 'Par produit' },
    // { value: 'pharmacy', label: 'Par pharmacie' }
  ];

  // Propriétés
  selectedProduct: Product | null = null;
  productModalTab: 'general' | 'pricing' | 'medical' | 'images' = 'general';
  @ViewChild('productDetailModal') productDetailModal!: TemplateRef<any>;

  // Modal references
  @ViewChild('rateModal') rateModal!: TemplateRef<any>;
  @ViewChild('editTaxModal') editTaxModal!: TemplateRef<any>;
  @ViewChild('deleteConfirmModal') deleteConfirmModal!: TemplateRef<any>;
  @ViewChild('impactAnalysisModal') impactAnalysisModal!: TemplateRef<any>;
  @ViewChild('addProductModal') addProductModal!: TemplateRef<any>;

  userDetail!: UserDetails;
  baseUrl = environment.baseUrl;

  private destroy$ = inject(DestroyRef);
  private modalService: NgbModal;
  private router = inject(Router);

  constructor(
    modalService: NgbModal,
    private location: Location,
    private route: ActivatedRoute,
    private auth: AuthService,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.modalService = modalService;
    this.rateForm = this.fb.group({});
    this.taxEditForm = this.fb.group({});
    this.taxProductForm = this.fb.group({});
    this.initializeForms();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroy$))
      .subscribe(params => {
        this.taxId = params['id'];
      });

    this.auth.userDetailsLoaded$
      .pipe(takeUntilDestroyed(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.setPermissions();

        if (loaded && this.userDetail && this.taxId) {
          await this.loadTaxDetails();
        }
      });
  }

  private setPermissions(): void {
    this.permissions.viewTax = this.userDetail.hasPermission('parametres.view');
    this.permissions.editTax = this.userDetail.hasPermission('parametres.update');
    this.permissions.deleteTax = this.userDetail.hasPermission('parametres.update');
    this.permissions.manageTaxRates = this.userDetail.hasPermission('parametres.update');
    this.permissions.viewProducts = this.userDetail.hasPermission('parametres.view');
    this.permissions.viewStatistics = this.userDetail.hasPermission('parametres.view');
  }

  private initializeForms(): void {
    this.rateForm = this.fb.group({
      value: ['', [Validators.required, Validators.min(0)]],
      effective_from: [this.formatDateForInput(new Date()), [Validators.required]],
      effective_to: [null]
    });

    this.taxEditForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      type: ['percentage', [Validators.required]],
      jurisdiction: ['national', [Validators.required]],
      applicable_on: ['all', [Validators.required]],
      is_active: [true],
      is_exemptible: [false],
      effective_from: [this.formatDateForInput(new Date()), [Validators.required]],
      effective_to: [null],
      initial_rate: ['', [Validators.required, Validators.min(0)]]
    });

    this.taxProductForm = this.fb.group({
      default_retro_applicable_on: [[], [Validators.required]],
    });

    // Validation conditionnelle pour le taux
    this.taxEditForm.get('type')?.valueChanges.subscribe(type => {
      const rateControl = this.taxEditForm.get('initial_rate');
      if (type === 'percentage') {
        rateControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      } else {
        rateControl?.setValidators([Validators.required, Validators.min(0)]);
      }
      rateControl?.updateValueAndValidity();
    });

    // Validation des dates
    this.rateForm.get('effective_to')?.valueChanges.subscribe(() => {
      this.validateDateRange(this.rateForm);
    });

    this.taxEditForm.get('effective_to')?.valueChanges.subscribe(() => {
      this.validateDateRange(this.taxEditForm);
    });
  }

  private validateDateRange(form: FormGroup): void {
    const from = form.get('effective_from')?.value;
    const to = form.get('effective_to')?.value;

    if (from && to && new Date(to) <= new Date(from)) {
      form.get('effective_to')?.setErrors({ invalidRange: true });
    }
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async loadTaxDetails(): Promise<void> {
    if (!this.permissions.viewTax) {
      this.handleError('Vous n\'avez pas la permission de voir les détails des taxes');
      return;
    }

    this.isLoading = true;
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

      this.apiService.post('pharmacy-management/taxes/list', { uid, populateAll: true, taxId: this.taxId }, headers)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error && response.data) {
              const taxData = response.data.find((t: any) => t._id === this.taxId);

              if (!taxData) {
                this.handleError('Taxe non trouvée');
                this.goBack();
              } else {
                // Les données viennent déjà calculées du backend
                this.tax = new TaxeModel(taxData);
                this.affectedProducts = taxData.products?.map((p: any) => new Product(p)) || [];
                this.affectedCategories = taxData.categories?.map((c: any) => new Category(c)) || [];
                this.statistics = taxData.statistics || this.statistics;
                this.impactAnalysis = taxData.impactAnalysis || [];
                this.defaultApplicableOnList = taxData.defaultApplicableOnList || [];

                this.populateEditForm();
                this.applyProductFilters();
                this.applyCategoryFilters();
              }
            } else {
              this.handleError(response?.errorMessage || 'Erreur lors du chargement de la taxe');
            }
            this.isLoading = false;
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement de la taxe');
            this.isLoading = false;
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isLoading = false;
      this.loadingService.setLoading(false);
    }
  }

  private populateEditForm(): void {
    if (!this.tax) return;

    const currentRate = this.tax.getCurrentRateFees();

    this.taxEditForm.patchValue({
      name: this.tax.name,
      description: this.tax.description,
      type: this.tax.type,
      jurisdiction: this.tax.jurisdiction,
      applicable_on: this.tax.applicable_on,
      is_active: this.tax.is_active,
      is_exemptible: this.tax.is_exemptible,
      effective_from: this.formatDateForInput(new Date(this.tax.effective_from)),
      effective_to: this.tax.effective_to ? this.formatDateForInput(new Date(this.tax.effective_to)) : null,
      initial_rate: currentRate
    });
  }

  // Filter methods
  applyProductFilters(): void {
    let filtered = [...this.affectedProducts];

    if (this.productSearchTerm) {
      const search = this.productSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search)
      );
    }

    if (this.productStatusFilter !== 'all') {
      filtered = filtered.filter(p =>
        this.productStatusFilter === 'active'
          ? p.status === 'active'
          : p.status !== 'active'
      );
    }

    this.filteredProducts = filtered;
  }

  applyCategoryFilters(): void {
    let filtered = [...this.affectedCategories];

    if (this.categorySearchTerm) {
      const search = this.categorySearchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search)
      );
    }

    this.filteredCategories = filtered;
  }

  onProductFilterChange(): void {
    this.productsPage = 1;
    this.applyProductFilters();
  }

  onCategoryFilterChange(): void {
    this.categoriesPage = 1;
    this.applyCategoryFilters();
  }

  // Pagination
  get paginatedProducts(): Product[] {
    const start = (this.productsPage - 1) * this.productsPerPage;
    const end = start + this.productsPerPage;
    return this.filteredProducts.slice(start, end);
  }

  get paginatedCategories(): Category[] {
    const start = (this.categoriesPage - 1) * this.categoriesPerPage;
    const end = start + this.categoriesPerPage;
    return this.filteredCategories.slice(start, end);
  }

  get totalProductPages(): number {
    return Math.ceil(this.filteredProducts.length / this.productsPerPage);
  }

  get totalCategoryPages(): number {
    return Math.ceil(this.filteredCategories.length / this.categoriesPerPage);
  }

  // Actions
  openEditModal(): void {
    if (!this.permissions.editTax) {
      this.handleError('Vous n\'avez pas la permission de modifier cette taxe');
      return;
    }

    if (!this.tax?.is_custom) {
      this.handleError('Les taxes système ne peuvent pas être modifiées');
      return;
    }

    this.populateEditForm();
    this.modalService.open(this.editTaxModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async saveProductTaxAdd(): Promise<void> {
    if (!this.taxProductForm.valid || !this.tax) {
      this.markFormGroupTouched(this.taxProductForm);
      this.handleError('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    this.isSubmitting = true;
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const formData = {
        applies_to_elemnents: true,
        ...this.tax,
        taxId: this.tax._id,
        ...this.taxProductForm.value,
        uid,
      };

      this.apiService.post('pharmacy-management/taxes/update', formData, headers)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Produit ajoute avec succès');
              this.closeModal();
              this.loadTaxDetails();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la mise à jour');
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  async saveTaxEdit(): Promise<void> {
    if (!this.taxEditForm.valid || !this.tax) {
      this.markFormGroupTouched(this.taxEditForm);
      this.handleError('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    this.isSubmitting = true;
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const formData = {
        ...this.taxEditForm.value,
        uid,
        taxId: this.tax._id
      };

      this.apiService.post('pharmacy-management/taxes/update', formData, headers)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Taxe mise à jour avec succès');
              this.closeModal();
              this.loadTaxDetails();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la mise à jour');
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  openAddRateModal(): void {
    if (!this.permissions.manageTaxRates) {
      this.handleError('Vous n\'avez pas la permission de gérer les taux');
      return;
    }

    if (!this.tax?.is_custom) {
      this.handleError('Les taux des taxes système ne peuvent pas être modifiés');
      return;
    }

    this.rateForm.reset({
      effective_from: this.formatDateForInput(new Date())
    });

    this.modalService.open(this.rateModal, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });
  }

  async addRate(): Promise<void> {
    if (!this.rateForm.valid || !this.tax) {
      this.markFormGroupTouched(this.rateForm);
      this.handleError('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    this.isSubmitting = true;
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const rateData = {
        taxId: this.tax._id,
        ...this.rateForm.value,
        uid
      };

      this.apiService.post('pharmacy-management/taxes/add-rate', rateData, headers)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Taux ajouté avec succès');
              this.closeModal();
              this.loadTaxDetails();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de l\'ajout du taux');
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  async toggleTaxStatus(): Promise<void> {
    if (!this.permissions.editTax || !this.tax) {
      this.handleError('Vous n\'avez pas la permission de modifier le statut');
      return;
    }

    if (!this.tax.is_custom) {
      this.handleError('Les taxes système ne peuvent pas être modifiées');
      return;
    }

    const confirmed = await this.showConfirmation(
      this.tax.is_active ? 'Désactiver la taxe' : 'Activer la taxe',
      `Êtes-vous sûr de vouloir ${this.tax.is_active ? 'désactiver' : 'activer'} cette taxe ?`,
      'Confirmer'
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

      this.apiService.post('pharmacy-management/taxes/toggle-status', {
        taxId: this.tax._id,
        uid
      }, headers)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Statut de la taxe mis à jour');
              this.loadTaxDetails();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la mise à jour');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la communication avec le serveur');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  async deleteTax(): Promise<void> {
    if (!this.permissions.deleteTax || !this.tax) {
      this.handleError('Vous n\'avez pas la permission de supprimer cette taxe');
      return;
    }

    if (!this.tax.is_custom) {
      this.handleError('Les taxes système ne peuvent pas être supprimées');
      return;
    }

    const confirmed = await this.showConfirmation(
      'Supprimer la taxe',
      `Êtes-vous sûr de vouloir supprimer la taxe "${this.tax.name}" ? Cette action est irréversible.`,
      'Supprimer',
      true
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

      this.apiService.post('pharmacy-management/taxes/delete', {
        taxId: this.tax._id,
        uid
      }, headers)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Taxe supprimée avec succès');
              this.goBack();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la suppression');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la communication avec le serveur');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  openImpactAnalysisModal(): void {
    this.modalService.open(this.impactAnalysisModal, {
      size: 'lg',
      centered: true
    });
  }

  // Export functions
  exportStatistics(): void {
    if (!this.tax) return;

    const csvData = this.prepareStatisticsCsvData();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `taxe_${this.tax.name}_statistiques_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showSuccess('Export CSV réussi');
  }

  private prepareStatisticsCsvData(): string {
    if (!this.tax) return '';

    const headers = ['Métrique', 'Valeur'];
    const rows = [
      ['Nom de la taxe', this.tax.name],
      ['Type', this.getTaxTypeLabel(this.tax.type)],
      ['Taux actuel', this.formatRate(this.tax)],
      ['Produits affectés', this.statistics.totalProducts.toString()],
      ['Catégories affectées', this.statistics.totalCategories.toString()],
      ['Produits actifs', this.statistics.activeProducts.toString()],
      ['Revenu mensuel estimé', `${this.statistics.estimatedMonthlyRevenue.toFixed(2)} XOF`],
      ['Taxe mensuelle estimée', `${this.statistics.estimatedMonthlyTaxAmount.toFixed(2)} XOF`],
      ['Prix moyen des produits', `${this.statistics.averageProductPrice.toFixed(2)} XOF`]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  printDetails(): void {
    window.print();
  }

  // Helper methods
  getTaxTypeLabel(type: TaxType): string {
    return this.TAX_TYPES.find(t => t.value === type)?.label || type;
  }

  getJurisdictionLabel(jurisdiction: Jurisdiction): string {
    return this.JURISDICTIONS.find(j => j.value === jurisdiction)?.label || jurisdiction;
  }

  getApplicableOnLabel(applicableOn: ApplicableOn): string {
    return this.APPLICABLE_ON.find(a => a.value === applicableOn)?.label || applicableOn;
  }

  formatDate(date: Date | string | undefined | null): string {
    if (!date) return '-';

    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatRate(tax: TaxeModel): string {
    const rate = tax.getCurrentRateFees();
    if (rate === null || rate === undefined) return 'N/A';

    const suffix = tax.type === 'percentage' ? '%' : ' XOF';
    return `${rate}${suffix}`;
  }

  formatCurrency(amount: number): string {
    return `${amount.toFixed(2)} XOF`;
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message,
      confirmButtonColor: '#d91a72'
    });
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

  private async showConfirmation(
    title: string,
    text: string,
    confirmButtonText: string,
    isDanger: boolean = false
  ): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Annuler',
      confirmButtonColor: isDanger ? '#f44336' : '#d91a72',
      cancelButtonColor: '#8C99AA'
    });

    return result.isConfirmed;
  }

  goBack(): void {
    this.location.back();
  }

  // Getters for template
  get currentRate(): number {
    return this.tax?.getCurrentRateFees() || 0;
  }

  get taxAge(): string {
    if (!this.tax?.createdAt) return 'N/A';

    const created = new Date(this.tax.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} jour(s)`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    return `${Math.floor(diffDays / 365)} an(s)`;
  }

  get activeRateAge(): string {
    const activeRate = this.tax?.getCurrentRate();
    if (!activeRate?.effective_from) return 'N/A';

    const from = new Date(activeRate.effective_from);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} jour(s)`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    return `${Math.floor(diffDays / 365)} an(s)`;
  }

  get totalRateChanges(): number {
    return this.tax?.rates?.length || 0;
  }

  estimatedAnnualTax(): number {
    return this.statistics.estimatedMonthlyTaxAmount * 12;
  }

  get taxEfficiency(): number {
    if (this.statistics.totalProducts === 0) return 0;
    return (this.statistics.activeProducts / this.statistics.totalProducts) * 100;
  }

  openAddProductModal(): void {
    if (!this.permissions.editTax) {
      this.handleError('Vous n\'avez pas la permission de modifier cette taxe');
      return;
    }

    this.taxProductForm.reset({
      default_retro_applicable_on: [[], [Validators.required]]
    });

    this.modalService.open(this.addProductModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

// Méthodes

  /**
   * Ouvre le modal de détail du produit
   */
  openProductModal(product: Product): void {
    this.selectedProduct = product;
    this.productModalTab = 'general';

    const modalRef = this.modalService.open(this.productDetailModal, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      scrollable: true,
      centered: true
    });
  }

  /**
   * Calcule le montant de la taxe pour un produit
   */
  calculateProductTax(product: Product): number {
    if (!this.tax || !product) return 0;

    if (this.tax.type === 'percentage') {
      return (product.price * this.currentRate) / 100;
    } else {
      return this.currentRate;
    }
  }

  /**
   * Calcule le prix TTC d'un produit
   */
  calculateProductPriceWithTax(product: Product): number {
    if (!product) return 0;
    return product.price + this.calculateProductTax(product);
  }

  /**
   * Calcule le montant de la taxe pour un prix de pharmacie
   */
  calculatePharmacyTax(price: number): number {
    if (!this.tax || !price) return 0;

    if (this.tax.type === 'percentage') {
      return (price * this.currentRate) / 100;
    } else {
      return this.currentRate;
    }
  }

  /**
   * Calcule la marge bénéficiaire d'un produit
   */
  calculateProfitMargin(product: Product): string {
    if (!product.cost || product.cost === 0) return 'N/A';

    const profit = product.price - product.cost;
    const margin = (profit / product.cost) * 100;

    return margin.toFixed(2);
  }

  /**
   * Obtient le label du statut du produit
   */
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Actif',
      'inactive': 'Inactif',
      'out_of_stock': 'Épuisé',
      'discontinued': 'Discontinué'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtient le label du type d'ordonnance
   */
  getPrescriptionTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'simple': 'Ordonnance simple',
      'renewable': 'Ordonnance renouvelable',
      'secure': 'Ordonnance sécurisée',
      'restricted': 'Ordonnance restreinte'
    };
    return typeMap[type] || type;
  }

  /**
   * Obtient le label de la forme galénique
   */
  getDrugFormLabel(form: string): string {
    const formMap: { [key: string]: string } = {
      'tablet': 'Comprimé',
      'capsule': 'Gélule',
      'syrup': 'Sirop',
      'injection': 'Injectable',
      'cream': 'Crème',
      'ointment': 'Pommade',
      'drops': 'Gouttes',
      'spray': 'Spray',
      'powder': 'Poudre',
      'solution': 'Solution',
      'suppository': 'Suppositoire',
      'patch': 'Patch'
    };
    return formMap[form] || form;
  }

  /**
   * Imprime les détails du produit
   */
  printProductDetails(): void {
    if (!this.selectedProduct) return;

    const printContent = this.generateProductPrintContent(this.selectedProduct);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  /**
   * Génère le contenu HTML pour l'impression
   */
  private generateProductPrintContent(product: Product): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Détails du produit - ${product.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #007bff;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          background-color: #f8f9fa;
          padding: 10px;
          border-left: 4px solid #007bff;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .info-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .info-label {
          font-weight: bold;
          width: 200px;
          color: #666;
        }
        .info-value {
          flex: 1;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-right: 5px;
        }
        .badge-success { background-color: #28a745; color: white; }
        .badge-danger { background-color: #dc3545; color: white; }
        .badge-warning { background-color: #ffc107; color: black; }
        .badge-info { background-color: #17a2b8; color: white; }
        .price-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .price-table th,
        .price-table td {
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        .price-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .total-row {
          background-color: #e7f3ff;
          font-weight: bold;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${product.name}</h1>
        <p>SKU: ${product.sku} | Date: ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      <div class="section">
        <div class="section-title">Informations générales</div>
        <div class="info-row">
          <div class="info-label">Nom:</div>
          <div class="info-value">${product.name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">SKU:</div>
          <div class="info-value">${product.sku}</div>
        </div>
        ${product.barcode ? `
        <div class="info-row">
          <div class="info-label">Code-barres:</div>
          <div class="info-value">${product.barcode}</div>
        </div>
        ` : ''}
        ${product.marque ? `
        <div class="info-row">
          <div class="info-label">Marque:</div>
          <div class="info-value">${product.marque}</div>
        </div>
        ` : ''}
        <div class="info-row">
          <div class="info-label">Statut:</div>
          <div class="info-value">
            <span class="badge badge-${product.status === 'active' ? 'success' : 'danger'}">
              ${this.getStatusLabel(product.status)}
            </span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Prix et taxes</div>
        <table class="price-table">
          <tr>
            <th>Description</th>
            <th>Montant</th>
          </tr>
          <tr>
            <td>Prix de vente (HT)</td>
            <td>${this.formatCurrency(product.price)}</td>
          </tr>
          <tr>
            <td>Taxe ${this.tax?.name} (${this.formatRate(this.tax!)})</td>
            <td>${this.formatCurrency(this.calculateProductTax(product))}</td>
          </tr>
          <tr class="total-row">
            <td>Prix de vente (TTC)</td>
            <td>${this.formatCurrency(this.calculateProductPriceWithTax(product))}</td>
          </tr>
        </table>
      </div>

      ${product.requiresPrescription ? `
      <div class="section">
        <div class="section-title">Informations médicales</div>
        <div class="info-row">
          <div class="info-label">Ordonnance:</div>
          <div class="info-value">
            <span class="badge badge-danger">Requise</span>
          </div>
        </div>
        ${product.drugForm ? `
        <div class="info-row">
          <div class="info-label">Forme:</div>
          <div class="info-value">${this.getDrugFormLabel(product.drugForm)}</div>
        </div>
        ` : ''}
        ${product.dosage ? `
        <div class="info-row">
          <div class="info-label">Dosage:</div>
          <div class="info-value">${product.dosage}</div>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div style="margin-top: 50px; text-align: center; color: #999; font-size: 12px;">
        Document généré le ${new Date().toLocaleString('fr-FR')} - ${this.tax?.name || 'Système de gestion'}
      </div>
    </body>
    </html>
  `;
  }

  /**
   * Navigation vers la page de détail complet du produit
   */
  navigateToProductDetail(): void {
    if (this.selectedProduct) {
      this.closeModal();
      this.router.navigate(['/pharmacy/products/', this.selectedProduct._id]);
    }
  }
}
