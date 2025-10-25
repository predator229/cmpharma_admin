import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, Location } from "@angular/common";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import {ApplicableOn, Jurisdiction, TaxeModel, TaxType} from 'src/app/models/Taxe.class';
import {UserDetails} from "../../../../../models/UserDatails";
import {environment} from "../../../../../../environments/environment";
import {AuthService} from "../../../../../controllers/services/auth.service";
import {ApiService} from "../../../../../controllers/services/api.service";

interface TaxFilter {
  search: string;
  type: TaxType | 'all';
  jurisdiction: Jurisdiction | 'all';
  isActive: 'all' | 'active' | 'inactive';
  isCustom: 'all' | 'custom' | 'system';
}

@Component({
  selector: 'app-pharmacy-tax-management',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './taxes-management.component.html',
  styleUrls: ['./taxes-management.component.scss']
})
export class PharmacyTaxManagementComponent implements OnInit, OnDestroy {
  // Data
  taxes: TaxeModel[] = [];
  filteredTaxes: TaxeModel[] = [];
  selectedTax: TaxeModel | null = null;

  // Loading states
  isLoading = false;
  isSubmitting = false;

  // Active tab
  activeTab: 'overview' | 'history' = 'overview';

  // Forms
  taxForm: FormGroup;
  rateForm: FormGroup;

  // Filters
  filters: TaxFilter = {
    search: '',
    type: 'all',
    jurisdiction: 'all',
    isActive: 'all',
    isCustom: 'all'
  };

  // Sorting
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Permissions
  permissions = {
    viewTaxes: false,
    createTax: false,
    editTax: false,
    deleteTax: false,
    manageTaxRates: false
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
    { value: 'all', label: 'Tous les produits' },
    { value: 'category', label: 'Par catégorie' },
    { value: 'product', label: 'Par produit' },
    { value: 'pharmacy', label: 'Par pharmacie' }
  ];

  // Modal references
  @ViewChild('taxModal') taxModal: ElementRef | undefined;
  @ViewChild('rateHistoryModal') rateHistoryModal: ElementRef | undefined;
  @ViewChild('deleteModal') deleteModal: ElementRef | undefined;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;

  constructor(
    modalService: NgbModal,
    private location: Location,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.modalService = modalService;
    this.initializeForms();
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.setPermissions();

        if (loaded && this.userDetail) {
          this.loadTaxes();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setPermissions(): void {
    this.permissions.viewTaxes = this.userDetail.hasPermission('taxes.view');
    this.permissions.createTax = this.userDetail.hasPermission('taxes.create');
    this.permissions.editTax = this.userDetail.hasPermission('taxes.edit');
    this.permissions.deleteTax = this.userDetail.hasPermission('taxes.delete');
    this.permissions.manageTaxRates = this.userDetail.hasPermission('taxes.manage_rates');
  }

  private initializeForms(): void {
    this.taxForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['percentage', [Validators.required]],
      jurisdiction: ['national', [Validators.required]],
      applicable_on: ['all', [Validators.required]],
      is_active: [true],
      is_exemptible: [false],
      effective_from: [new Date(), [Validators.required]],
      effective_to: [null],
      initial_rate: ['', [Validators.required, Validators.min(0)]]
    });

    this.rateForm = this.fb.group({
      value: ['', [Validators.required, Validators.min(0)]],
      effective_from: [new Date(), [Validators.required]],
      effective_to: [null]
    });
  }

  async loadTaxes(): Promise<void> {
    if (!this.permissions.viewTaxes) return;

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

      this.apiService.post('pharmacy-management/taxes/list', { uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error && response.data) {
              this.taxes = response.data.map((t: any) => new TaxeModel(t));
              this.applyFilters();
            }
            this.loadingService.setLoading(false);
          },
          error: () => {
            this.handleError('Erreur lors du chargement des taxes');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  applyFilters(): void {
    let filtered = [...this.taxes];

    // Search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search)
      );
    }

    // Type filter
    if (this.filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === this.filters.type);
    }

    // Jurisdiction filter
    if (this.filters.jurisdiction !== 'all') {
      filtered = filtered.filter(t => t.jurisdiction === this.filters.jurisdiction);
    }

    // Active filter
    if (this.filters.isActive === 'active') {
      filtered = filtered.filter(t => t.is_active);
    } else if (this.filters.isActive === 'inactive') {
      filtered = filtered.filter(t => !t.is_active);
    }

    // Custom/System filter
    if (this.filters.isCustom === 'custom') {
      filtered = filtered.filter(t => t.is_custom);
    } else if (this.filters.isCustom === 'system') {
      filtered = filtered.filter(t => !t.is_custom);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[this.sortColumn as keyof TaxeModel];
      let bVal: any = b[this.sortColumn as keyof TaxeModel];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.totalItems = filtered.length;

    // Pagination
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.filteredTaxes = filtered.slice(start, end);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyFilters();
  }

  openCreateModal(): void {
    if (!this.permissions.createTax) return;

    this.selectedTax = null;
    this.taxForm.reset({
      type: 'percentage',
      jurisdiction: 'national',
      applicable_on: 'all',
      is_active: true,
      is_exemptible: false,
      effective_from: new Date()
    });

    this.modalService.open(this.taxModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  openEditModal(tax: TaxeModel): void {
    if (!this.permissions.editTax || !tax.is_custom) return;

    this.selectedTax = tax;
    const currentRate = tax.getCurrentRateFees();

    this.taxForm.patchValue({
      name: tax.name,
      description: tax.description,
      type: tax.type,
      jurisdiction: tax.jurisdiction,
      applicable_on: tax.applicable_on,
      is_active: tax.is_active,
      is_exemptible: tax.is_exemptible,
      effective_from: tax.effective_from,
      effective_to: tax.effective_to,
      initial_rate: currentRate
    });

    this.modalService.open(this.taxModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async saveTax(): Promise<void> {
    if (!this.taxForm.valid) return;

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
        ...this.taxForm.value,
        uid,
        taxId: this.selectedTax?._id
      };

      const endpoint = this.selectedTax
        ? 'pharmacy-management/taxes/update'
        : 'pharmacy-management/taxes/create';

      this.apiService.post(endpoint, formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess(
                this.selectedTax
                  ? 'Taxe mise à jour avec succès'
                  : 'Taxe créée avec succès'
              );
              this.closeModal();
              this.loadTaxes();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la sauvegarde');
            }
            this.isSubmitting = false;
          },
          error: () => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  openRateHistoryModal(tax: TaxeModel): void {
    this.selectedTax = tax;
    this.rateForm.reset({
      effective_from: new Date()
    });

    this.modalService.open(this.rateHistoryModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async addRate(): Promise<void> {
    if (!this.rateForm.valid || !this.selectedTax) return;

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
        taxId: this.selectedTax._id,
        ...this.rateForm.value,
        uid
      };

      this.apiService.post('pharmacy-management/taxes/add-rate', rateData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Taux ajouté avec succès');
              this.rateForm.reset({ effective_from: new Date() });
              this.loadTaxes();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de l\'ajout du taux');
            }
            this.isSubmitting = false;
          },
          error: () => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  async toggleTaxStatus(tax: TaxeModel): Promise<void> {
    if (!this.permissions.editTax || !tax.is_custom) return;

    const confirmed = await this.showConfirmation(
      tax.is_active ? 'Désactiver la taxe' : 'Activer la taxe',
      `Êtes-vous sûr de vouloir ${tax.is_active ? 'désactiver' : 'activer'} cette taxe ?`,
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
        taxId: tax._id,
        uid
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Statut de la taxe mis à jour');
              this.loadTaxes();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la mise à jour');
            }
          },
          error: () => {
            this.handleError('Erreur lors de la communication avec le serveur');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  async deleteTax(tax: TaxeModel): Promise<void> {
    if (!this.permissions.deleteTax || !tax.is_custom) return;

    const confirmed = await this.showConfirmation(
      'Supprimer la taxe',
      `Êtes-vous sûr de vouloir supprimer la taxe "${tax.name}" ? Cette action est irréversible.`,
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

      this.apiService.post('pharmacy-management/taxes/delete', {
        taxId: tax._id,
        uid
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Taxe supprimée avec succès');
              this.loadTaxes();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la suppression');
            }
          },
          error: () => {
            this.handleError('Erreur lors de la communication avec le serveur');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

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
    if (rate === null) return 'N/A';

    const suffix = tax.type === 'percentage' ? '%' : ' XOF';
    return `${rate}${suffix}`;
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
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

  goBack(): void {
    this.location.back();
  }

  protected readonly Math = Math;

  getTaxesSystem() {
    return this.getTaxesCustomOrSystem(false);
  }

  getTaxesCustom() {
    return this.getTaxesCustomOrSystem(true);
  }

  private getTaxesCustomOrSystem(custom?: boolean) {
    return custom === undefined ? this.taxes.filter(t => t.is_custom === custom)?.length : this.taxes.length;
  }

  getTaxesActives() {
    return this.taxes.filter(t => t.is_active)?.length;
  }

  getTaxesInactives() {
    return this.taxes.filter(t => !t.is_active)?.length;
  }
}
