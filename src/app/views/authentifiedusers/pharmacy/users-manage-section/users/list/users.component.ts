import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../../controllers/services/auth.service";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserDetails } from "../../../../../../models/UserDatails";
import { environment } from "../../../../../../../environments/environment";
import { Select2 } from "ng-select2-component";
import { Group } from "../../../../../../models/Group.class";
import { Country } from "../../../../../../models/Country.class";
import {PharmacyClass} from "../../../../../../models/Pharmacy.class";
import {Admin} from "../../../../../../models/Admin.class";
import {CommonFunctions} from "../../../../../../controllers/comonsfunctions";
import {Select2AjaxComponent} from "../../../../sharedComponents/select2-ajax/select2-ajax.component";
import {Product} from "../../../../../../models/Product";

@Component({
  selector: 'app-pharmacy-users-list',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, Select2], //Select2AjaxComponent
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class PharmacyUsersListComponent implements OnInit, OnDestroy {
  users: Admin[] = [];
  filteredUsers: Admin[] = [];
  isLoading: boolean = false;
  totalUsers: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  // Search and filter
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedRole: string = '';
  selectedPharmacy: string = '';
  sortBy: string = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Forms
  createUserForm: FormGroup;
  bulkActionForm: FormGroup;

  groups: Group[] = [];
  groupsArraySelect2: Array<{value: string, label: string}> = [];
  pharmacies: PharmacyClass[] = [];
  pharmaciesArraySelect2: Array<{value: string, label: string}> = [];

  // Selection
  selectedUsers: Set<string> = new Set();
  selectAll: boolean = false;

  permissions = {
    createUser: false,
    editUser: false,
    deleteUser: false,
    viewUsers: false,
    bulkActions: false,
  };

  protected readonly Math = Math;
  baseUrl = environment.baseUrl;

  countriesListArray: { [id: string]: Country } | null;

  userRoles = [
    { value: '', label: 'Tous les rôles' },
    { value: 'manager_pharmacy', label: 'Gestionnaire de Pharmacie' },
    { value: 'pharmacien', label: 'Pharmacien' },
    { value: 'preparateur', label: 'Préparateur' },
    { value: 'caissier', label: 'Caissier' },
    { value: 'consultant', label: 'Consultant' }
  ];

  userStatuses = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'disabled', label: 'Désactivés' },
    { value: 'not_activated', label: 'Non activés' },
    { value: 'locked', label: 'Bloqués' }
  ];

  sortOptions = [
    { value: 'name', label: 'Nom' },
    { value: 'email', label: 'Email' },
    { value: 'createdAt', label: 'Date de création' },
    { value: 'lastLogin', label: 'Dernière connexion' }
  ];

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  userDetail: UserDetails;
  internatPathUrl = environment.internalPathUrl;

  @ViewChild('editCategoryModal') editCategoryModal: ElementRef | undefined;
  @ViewChild('bulkActionModal') bulkActionModal: ElementRef | undefined;

  constructor( private modalService: NgbModal,  private auth: AuthService,  private router: Router,  private apiService: ApiService,  private loadingService: LoadingService,  private fb: FormBuilder) {
    this.initializeForms();
    this.setupSearch();
    this.initializecountriesListArray();

    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.permissions.viewUsers = this.userDetail.hasPermission('utilisateurs.view');
        this.permissions.createUser = this.userDetail.hasPermission('utilisateurs.create');
        this.permissions.editUser = this.userDetail.hasPermission('utilisateurs.edit');
        this.permissions.deleteUser = this.userDetail.hasPermission('utilisateurs.delete');
        this.permissions.bulkActions = this.userDetail.hasPermission('utilisateurs.export');

        if (loaded && this.userDetail) {
          await this.loadUsers();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializecountriesListArray(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token) {this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('tools/get-countries-list', {uid}, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (response: any) => {
            if (response && response.data) {
              this.countriesListArray = response.data;

              // this.countries = response.dataArray.map((item: any) => new Country(item)) ?? [];
              // this.countriesArraySelect2 = this.countries.map(country => ({
              //   value: country._id!,
              //   label: country.name
              // }));
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement de la liste des pays');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  initializeForms(): void {
    // Formulaire de création d'utilisateur
    this.createUserForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      surname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[+]?[0-9]{8,15}$/)]],
      // country: [''],
      // city: [''],
      address: [''],
      groups: [[], [Validators.required]],
      pharmaciesManaged: [[], Validators.required],
      sendWelcomeEmail: [true],
      isActivated: [true],
    });

    // Formulaire d'actions en lot
    this.bulkActionForm = this.fb.group({
      action: ['', [Validators.required]],
      newStatus: [''],
      newGroups: [[]],
      newPharmacy: [''],
    });
  }

  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadUsers();
    });
  }

  async loadUsers(): Promise<void> {
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

      const params = {
        uid,
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.searchTerm,
        status: this.selectedStatus,
        role: this.selectedRole,
        pharmacy: this.selectedPharmacy,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder
      };

      this.apiService.post('pharmacy-management/users/list', params, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data && !response.error) {

              this.users = response.data.users.map((user: any) => new Admin(user)) ?? [];
              this.filteredUsers = [...this.users];

              this.totalUsers = response.data.total;
              this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
              this.selectedUsers.clear();
              this.selectAll = false;

              this.groups = response.groups.map((item: any) => new Group(item));
              this.groupsArraySelect2 = this.groups.map(group => ({
                value: group._id!,
                label: group.name
              }));

              this.pharmacies = response.pharmsFullInfos.map((item: any) => CommonFunctions.mapToPharmacy(item));
              console.log(this.pharmacies);
              this.pharmaciesArraySelect2 =
                this.pharmacies.
                filter(pharmacy => pharmacy != null).
                map(pharmacy => ({
                value: pharmacy.id,
                label:pharmacy.name
              }));

            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors du chargement des utilisateurs');
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des utilisateurs');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  onCitySelected(city: string, type: number = 0) {
    this.createUserForm.patchValue({city: city});
  }
  onCountrySelected(countryCode: string): void {
    const selectedCountry = this.countriesListArray?.[countryCode];
    if (!selectedCountry) {
      this.handleError("Le pays n'a pas été retrouvé");
      return;
    }
    const currentCountry = this.createUserForm.get('country')?.value;
    if (currentCountry !== selectedCountry._id) {
      this.createUserForm.patchValue({city: ''});
      this.createUserForm.patchValue({country: selectedCountry._id});
      // this.startingPhoneNumber = selectedCountry.dial_code;
    }
    // this.IsDisabledTel = true;
  }


  filterProducts(): void {
    let filtered = [...this.users];

    if (this.searchTerm) {
      const searchTerms = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchTerms) ||
        p.surname?.toLowerCase().includes(searchTerms) ||
        p.email?.toLowerCase().includes(searchTerms) ||
        p.address?.toLowerCase().includes(searchTerms) ||
        p.city?.toLowerCase().includes(searchTerms) ||
        p.country?.name.toLowerCase().includes(searchTerms) ||
        p.country?.code.toLowerCase().includes(searchTerms) ||
        p.country?.dial_code.toLowerCase().includes(searchTerms) ||
        p.groups?.some( g => g.name.toLowerCase().includes(searchTerms) )
      );
    }
    this.filteredUsers = filtered;
    this.totalPages = Math.max(1, Math.ceil(this.filteredUsers.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    // this.updatePaginationInfo();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onRoleFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onPharmacyFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onSortChange(): void {
    this.loadUsers();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.loadUsers();
  }

  // Pagination methods
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  getPaginationArray(): number[] {
    const maxVisible = 5;
    const start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible - 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Selection methods
  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedUsers.clear();
    } else {
      this.users.forEach(user => this.selectedUsers.add(user._id!));
    }
    this.selectAll = !this.selectAll;
  }

  toggleUserSelection(userId: string): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
    this.selectAll = this.selectedUsers.size === this.users.length;
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.has(userId);
  }

  // CRUD operations
  async createUser(): Promise<void> {
    if (!this.createUserForm.valid) {
      this.handleError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      this.loadingService.setLoading(true);
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const formData = { ...this.createUserForm.value, uid };

      this.apiService.post('pharmacy-management/users/create', formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Utilisateur créé avec succès');
              this.createUserForm.reset();
              this.createUserForm.patchValue({
                sendWelcomeEmail: true,
                isActivated: true
              });
              this.modalService.dismissAll();
              this.loadUsers();
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la création');
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors de la création de l\'utilisateur');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  viewUser(userId: string): void {
    this.router.navigate(['/admin/users/detail', userId]);
  }

  editUser(userId: string): void {
    this.router.navigate(['/admin/users/edit', userId]);
  }

  async deleteUser(user: Admin): Promise<void> {
    const confirmed = await this.showConfirmation(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.getFullName()}" ? Cette action est irréversible.`,
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

      this.apiService.post('pharmacy-management/users/delete', { id: user._id, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Utilisateur supprimé avec succès');
              this.loadUsers();
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la suppression');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la suppression de l\'utilisateur');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  async toggleUserStatus(user: Admin): Promise<void> {
    const action = user.disabled ? 'activer' : 'désactiver';

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('pharmacy-management/users/toggle-status', {
        id: user._id,
        disabled: !user.disabled,
        uid
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess(`Utilisateur ${action} avec succès`);
              this.loadUsers();
            } else {
              this.handleError(response.errorMessage || `Erreur lors de l'${action}`);
            }
          },
          error: (error) => {
            this.handleError(`Erreur lors de l'${action} de l'utilisateur`);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  // Bulk operations
  async executeBulkAction(): Promise<void> {
    if (!this.bulkActionForm.valid || this.selectedUsers.size === 0) {
      this.handleError('Veuillez sélectionner une action et au moins un utilisateur');
      return;
    }

    const action = this.bulkActionForm.get('action')?.value;
    const userIds = Array.from(this.selectedUsers);

    const confirmed = await this.showConfirmation(
      'Action en lot',
      `Êtes-vous sûr de vouloir exécuter cette action sur ${userIds.length} utilisateur(s) ?`,
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

      const requestData = {
        action,
        userIds,
        uid,
        ...this.bulkActionForm.value
      };

      this.apiService.post('pharmacy-management/users/bulk-action', requestData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess(`Action exécutée avec succès sur ${userIds.length} utilisateur(s)`);
              this.selectedUsers.clear();
              this.selectAll = false;
              this.bulkActionForm.reset();
              this.modalService.dismissAll();
              this.loadUsers();
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de l\'exécution de l\'action');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de l\'exécution de l\'action en lot');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  // Utility methods
  getUserStatusLabel(user: Admin): string {
    if (!user.isActivated) return 'Non activé';
    if (user.disabled) return 'Désactivé';
    if (user.isAccountLocked()) return 'Bloqué';
    return 'Actif';
  }

  getUserStatusClass(user: Admin): string {
    if (!user.isActivated) return 'bg-secondary';
    if (user.disabled) return 'bg-danger';
    if (user.isAccountLocked()) return 'bg-warning';
    return 'bg-success';
  }

  getRoleLabels(groups: Group[]): string[] {
    return groups.map(group => {
      const role = this.userRoles.find(r => r.value === group.code);
      return role ? role.label : group.name;
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'Ce champ est obligatoire';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      if (control.errors['email']) return 'Format d\'email invalide';
      if (control.errors['pattern']) return 'Format invalide';
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

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedRole = '';
    this.selectedPharmacy = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  exportUsers(): void {
    // Implementation for exporting users
    this.showSuccess('Export en cours...');
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

  openCreateModal(): void {
    this.modalService.dismissAll('ok');
    this.createUserForm.reset();
    this.createUserForm.patchValue({
      sendWelcomeEmail: true,
      isActivated: true
    });
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
  }
  openBulkActionModal(): void {
    if (this.selectedUsers.size === 0) {
      this.handleError('Veuillez sélectionner au moins un utilisateur');
      return;
    }
    this.bulkActionForm.reset();
  }

  trackByUserId(index: number, user: Admin): string {
    return user._id || index.toString();
  }

  getUsersActivate(status: number) {
    return this.users.filter(u => status == 1 ? u.isActive(): ( status == 2 ? u.disabled : !u.isActivated)).length;
  }
}
