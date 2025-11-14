import {Component, OnInit, ViewChild, TemplateRef, inject, DestroyRef} from '@angular/core';
import { CommonModule, Location } from "@angular/common";
import {Router, RouterModule} from "@angular/router";
import { HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import {ApplicableOn, Jurisdiction, TaxeModel, TaxType} from 'src/app/models/Taxe.class';
import {UserDetails} from "../../../../../../models/UserDatails";
import {environment} from "../../../../../../../environments/environment";
import {AuthService} from "../../../../../../controllers/services/auth.service";
import {ApiService} from "../../../../../../controllers/services/api.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {take} from "rxjs/operators";

interface TaxFilter {
  search: string;
  type: TaxType | 'all';
  jurisdiction: Jurisdiction | 'all';
  isActive: 'all' | 'active' | 'inactive';
  isCustom: 'all' | 'custom' | 'system';
}

@Component({
  selector: 'app-pharmacy-taxes-management',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './taxes-management.component.html',
  styleUrls: ['./taxes-management.component.scss']
})
export class PharmacyTaxesManagementComponent implements OnInit {
  private router = inject(Router);
  taxes: TaxeModel[] = [];
  filteredTaxes: TaxeModel[] = [];
  selectedTax: TaxeModel | null = null;

  isLoading = false;
  isSubmitting = false;

  activeTab: 'overview' | 'history' = 'overview';

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
    // { value: 'pharmacy', label: 'Par pharmacie' }
  ];

  informationsLabels = {
    'all' : `"Tous les produits" ajoutent automatiquement cette taxe par défaut`,
    'category': `Tous les produits des categories associe ajoutent automatiquement cette taxe par défaut`,
    'product': `Taxe associe uniquement au produit individuellement`
  }

  // Modal references
  @ViewChild('taxModal') taxModal!: TemplateRef<any>;
  @ViewChild('rateHistoryModal') rateHistoryModal!: TemplateRef<any>;

  userDetail!: UserDetails;
  baseUrl = environment.baseUrl;

  private destroy$ = inject(DestroyRef);
  private modalService: NgbModal;

  constructor(
    modalService: NgbModal,
    private location: Location,
    private auth: AuthService,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.modalService = modalService;
    this.taxForm = this.fb.group({});
    this.rateForm = this.fb.group({});
    this.initializeForms();
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntilDestroyed(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.setPermissions();

        if (loaded && this.userDetail) {
          await this.loadTaxes();
        }
      });
  }

  private setPermissions(): void {
    this.permissions.viewTaxes = this.userDetail.hasPermission('parametres.view');
    this.permissions.createTax = this.userDetail.hasPermission('parametres.import');
    this.permissions.editTax = this.userDetail.hasPermission('parametres.update');
    this.permissions.deleteTax = this.userDetail.hasPermission('parametres.update');
    this.permissions.manageTaxRates = this.userDetail.hasPermission('parametres.update');
  }

  private initializeForms(): void {
    this.taxForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      type: ['percentage', [Validators.required]],
      jurisdiction: ['national', [Validators.required]],
      applicable_on: ['all', [Validators.required]],
      is_active: [true],
      applies_to_elemnents: [false],
      is_exemptible: [false],
      effective_from: [this.formatDateForInput(new Date()), [Validators.required]],
      effective_to: [null],
      initial_rate: ['', [Validators.required, Validators.min(0)]]
    });

    // Ajouter validation conditionnelle pour le taux
    this.taxForm.get('type')?.valueChanges.subscribe(type => {
      const rateControl = this.taxForm.get('initial_rate');
      if (type === 'percentage') {
        rateControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      } else {
        rateControl?.setValidators([Validators.required, Validators.min(0)]);
      }
      rateControl?.updateValueAndValidity();
    });

    this.rateForm = this.fb.group({
      value: ['', [Validators.required, Validators.min(0)]],
      effective_from: [this.formatDateForInput(new Date()), [Validators.required]],
      effective_to: [null]
    });

    // Validation des dates
    this.taxForm.get('effective_to')?.valueChanges.subscribe(() => {
      this.validateDateRange(this.taxForm);
    });

    this.rateForm.get('effective_to')?.valueChanges.subscribe(() => {
      this.validateDateRange(this.rateForm);
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

  async loadTaxes(): Promise<void> {
    if (!this.permissions.viewTaxes){
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

      this.apiService.post('pharmacy-management/taxes/list', { uid }, headers)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error && response.data) {
              this.taxes = response.data.map((t: any) => new TaxeModel(t));
              this.applyFilters();
            } else {
              this.handleError(response?.errorMessage || 'Erreur lors du chargement des taxes');
            }
            this.isLoading = false;
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des taxes');
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

  resetFilters(): void {
    this.filters = {
      search: '',
      type: 'all',
      jurisdiction: 'all',
      isActive: 'all',
      isCustom: 'all'
    };
    this.onFilterChange();
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
    if (page < 1 || page > Math.ceil(this.totalItems / this.itemsPerPage)) {
      return;
    }
    this.currentPage = page;
    this.applyFilters();
  }

  openCreateModal(): void {
    if (!this.permissions.createTax) {
      this.handleError('Vous n\'avez pas la permission de créer des taxes');
      return;
    }

    this.selectedTax = null;
    this.taxForm.reset({
      type: 'percentage',
      jurisdiction: 'national',
      applicable_on: 'all',
      is_active: true,
      applies_to_elemnents: false,
      is_exemptible: false,
      effective_from: this.formatDateForInput(new Date())
    });

    this.modalService.open(this.taxModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  openEditModal(tax: TaxeModel): void {
    if (!this.permissions.editTax) {
      this.handleError('Vous n\'avez pas la permission de modifier des taxes');
      return;
    }

    if (!tax.is_custom) {
      this.handleError('Les taxes système ne peuvent pas être modifiées');
      return;
    }

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
      effective_from: this.formatDateForInput(new Date(tax.effective_from)),
      effective_to: tax.effective_to ? this.formatDateForInput(new Date(tax.effective_to)) : null,
      initial_rate: currentRate
    });

    this.modalService.open(this.taxModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async saveTax(): Promise<void> {
    if (!this.taxForm.valid) {
      this.markFormGroupTouched(this.taxForm);
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
        ...this.taxForm.value,
        uid,
        taxId: this.selectedTax?._id
      };

      const endpoint = this.selectedTax
        ? 'pharmacy-management/taxes/update'
        : 'pharmacy-management/taxes/create';

      this.apiService.post(endpoint, formData, headers)
        .pipe(take(1))
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

  openRateHistoryModal(tax: TaxeModel): void {
    if (!this.permissions.manageTaxRates) {
      this.handleError('Vous n\'avez pas la permission de gérer les taux');
      return;
    }

    if (!tax.is_custom) {
      this.handleError('Les taux des taxes système ne peuvent pas être modifiés');
      return;
    }

    this.selectedTax = tax;
    this.rateForm.reset({
      effective_from: this.formatDateForInput(new Date())
    });

    this.modalService.open(this.rateHistoryModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async addRate(): Promise<void> {
    if (!this.rateForm.valid) {
      this.markFormGroupTouched(this.rateForm);
      this.handleError('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    if (!this.selectedTax) return;

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
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Taux ajouté avec succès');
              this.rateForm.reset({ effective_from: this.formatDateForInput(new Date()) });
              this.loadTaxes();

              // Mettre à jour la taxe sélectionnée
              if (response.data) {
                this.selectedTax = new TaxeModel(response.data);
              }
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

  async toggleTaxStatus(tax: TaxeModel): Promise<void> {
    if (!this.permissions.editTax) {
      this.handleError('Vous n\'avez pas la permission de modifier le statut des taxes');
      return;
    }

    if (!tax.is_custom) {
      this.handleError('Les taxes système ne peuvent pas être modifiées');
      return;
    }

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
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Statut de la taxe mis à jour');
              this.loadTaxes();
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

  async deleteTax(tax: TaxeModel): Promise<void> {
    if (!this.permissions.deleteTax) {
      this.handleError('Vous n\'avez pas la permission de supprimer des taxes');
      return;
    }

    if (!tax.is_custom) {
      this.handleError('Les taxes système ne peuvent pas être supprimées');
      return;
    }

    const confirmed = await this.showConfirmation(
      'Supprimer la taxe',
      `Êtes-vous sûr de vouloir supprimer la taxe "${tax.name}" ? Cette action est irréversible.`,
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
        taxId: tax._id,
        uid
      }, headers)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Taxe supprimée avec succès');
              this.loadTaxes();
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

  // Export functionalities
  exportToCSV(): void {
    const csvData = this.prepareCsvData();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `taxes_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showSuccess('Export CSV réussi');
  }

  private prepareCsvData(): string {
    const headers = ['Nom', 'Type', 'Taux actuel', 'Juridiction', 'Applicable sur', 'Actif', 'Source'];
    const rows = this.taxes.map(tax => [
      tax.name,
      this.getTaxTypeLabel(tax.type),
      this.formatRate(tax),
      this.getJurisdictionLabel(tax.jurisdiction),
      this.getApplicableOnLabel(tax.applicable_on),
      tax.is_active ? 'Oui' : 'Non',
      tax.is_custom ? 'Locale' : 'Système'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  printTable(): void {
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
    if (rate === null) return 'N/A';

    const suffix = tax.type === 'percentage' ? '%' : ' XOF';
    return `${rate}${suffix}`;
  }

  closeModal(): void {
    this.modalService.dismissAll();
    this.selectedTax = null;
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

  // Stats methods
  getTaxesSystem(): number {
    return this.taxes.filter(t => !t.is_custom).length;
  }

  getTaxesCustom(): number {
    return this.taxes.filter(t => t.is_custom).length;
  }

  getTaxesActives(): number {
    return this.taxes.filter(t => t.is_active).length;
  }

  getTaxesInactives(): number {
    return this.taxes.filter(t => !t.is_active).length;
  }

  protected readonly Math = Math;

  reseteffectiveFormRateForm() {
    this.rateForm.reset({ effective_from: this.formatDateForInput(new Date()) })
  }

  goToTax(tax: TaxeModel) {
    this.router.navigate(['pharmacy/taxes/settings/', tax._id]);
  }

  applicableOnTooltip() {
    return this.informationsLabels[this.taxForm.get('applicable_on').value];
  }
}
