import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../controllers/services/auth.service";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators, FormArray } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserDetails } from "../../../../../models/UserDatails";
import { environment } from "../../../../../../environments/environment";
import { Select2 } from "ng-select2-component";
import { Group, GroupCode, Platform } from "../../../../../models/Group.class";
import { Permission } from "../../../../../models/Permission.class";
import { Admin } from "../../../../../models/Admin.class";
import { CommonFunctions } from "../../../../../controllers/comonsfunctions";
import {group} from "@angular/animations";

interface UserPermissionView {
  user: Admin;
  currentGroups: Group[];
  availableGroups: Group[];
  directPermissions: Permission[];
  inheritedPermissions: Permission[];
  isExpanded: boolean;
  hasChanges: boolean;
  pendingGroups: string[];
  pendingPermissions: string[];
}

interface PermissionModule {
  module: string;
  permissions: Permission[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-pharmacy-permissions-management',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, Select2], //Select2AjaxComponent
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss']
})
export class PharmacyPermissionsManagementComponent implements OnInit, OnDestroy {
  // Data properties
  users: Admin[] = [];
  groups: Group[] = [];
  permissions: Permission[] = [];
  permissionModules: PermissionModule[] = [];
  userPermissions: UserPermissionView[] = [];

  // Loading and pagination
  isLoading: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalUsers: number = 0;
  totalPages: number = 0;

  // Search and filters
  searchTerm: string = '';
  selectedGroup: string = '';
  selectedPlatform: string = '';
  selectedModule: string = '';
  showOnlyWithChanges: boolean = false;

  // Forms
  bulkPermissionForm: FormGroup;
  groupManagementForm: FormGroup;
  permissionForm: FormGroup;

  // Selection
  selectedUsers: Set<string> = new Set();
  selectAll: boolean = false;

  // View states
  activeTab: 'users' | 'groups' | 'permissions' = 'users';
  viewMode: 'list' | 'matrix' = 'list';

  // Platform and group options
  platformOptions = [
    { value: '', label: 'Toutes les plateformes' },
    // { value: Platform.ADMIN, label: 'Administration' },
    { value: Platform.PHARMACY, label: 'Pharmacie' },
    // { value: Platform.DELIVER, label: 'Livraison' }
  ];

  groupOptions: Array<{value: string, label: string}> = [];
  moduleOptions: Array<{value: string, label: string}> = [];

  permissions_ = {
    viewPermissions: false,
    editPermissions: false,
    manageGroups: false,
    assignPermissions: false,
  };

  protected readonly Math = Math;
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  userDetail: UserDetails;
  private modalService: NgbModal;

  @ViewChild('bulkPermissionModal') bulkPermissionModal: ElementRef | undefined;
  // @ViewChild('categoryDetailsModal') categoryDetailsModal: ElementRef | undefined;
  @ViewChild('groupManagementModal') groupManagementModal: ElementRef | undefined;
  @ViewChild('permissionModal') permissionModal: ElementRef | undefined;

  constructor(
    modalService: NgbModal,
    private auth: AuthService,
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.initializeForms();
    this.setupSearch();

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
        this.permissions_.viewPermissions = this.userDetail.hasPermission('utilisateurs.permissions');
        this.permissions_.editPermissions = this.userDetail.hasPermission('utilisateurs.permissions');
        this.permissions_.manageGroups = this.userDetail.hasPermission('utilisateurs.permissions');
        this.permissions_.assignPermissions = this.userDetail.hasPermission('utilisateurs.permissions');

        if (loaded && this.userDetail) {
          await this.loadInitialData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.bulkPermissionForm = this.fb.group({
      action: ['', [Validators.required]],
      targetGroups: [[]],
      targetPermissions: [[]],
      newGroups: [[]],
      newPermissions: [[]]
    });

    this.groupManagementForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required]],
      description: [''],
      platform: ['', [Validators.required]],
      isActive: [true],
      permissions: [[]]
    });

    this.permissionForm = this.fb.group({
      module: ['', [Validators.required]],
      label: [''],
      description: [''],
      platform: ['', [Validators.required]],
      permissions: this.fb.array([])
    });
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.filterUsers();
    });
  }

  private async loadInitialData(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      await Promise.all([
        this.loadPermissions(),
        this.loadUsers()
      ]);
      this.buildUserPermissionViews();
    } catch (error) {
      this.handleError('Erreur lors du chargement des données');
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  private async loadUsers(): Promise<void> {
    const token = await this.auth.getRealToken();
    const uid = await this.auth.getUid();

    if (!token) {
      this.handleError('Vous n\'êtes pas autorisé');
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
      group: this.selectedGroup,
      platform: this.selectedPlatform
    };

    this.apiService.post('pharmacy-management/users/list', params, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && response.data && !response.error) {
            this.users = response.data.users.map((user: any) => new Admin(user)) ?? [];
            this.totalUsers = response.data.total;
            this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);

            this.groups = response.groups.map((group: any) => new Group(group)) ?? [];
            this.groupOptions = this.groups.map(group => ({
              value: group._id!,
              label: `${group.name} (${group.plateform})`
            }));

          } else {
            this.handleError(response.errorMessage ?? 'Erreur lors du chargement des utilisateurs');
          }
        },
        error: (error) => {
          this.handleError('Erreur lors du chargement des utilisateurs');
        }
      });
  }

  private async loadPermissions(): Promise<void> {
    const token = await this.auth.getRealToken();
    const uid = await this.auth.getUid();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    this.apiService.post('pharmacy-management/permissions/list', { uid }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && response.data && !response.error) {
            this.permissions = response.data.map((perm: any) => new Permission(perm)) ?? [];
            this.buildPermissionModules();
          }
        },
        error: (error) => {
          this.handleError('Erreur lors du chargement des permissions');
        }
      });
  }

  private buildPermissionModules(): void {
    const moduleMap = new Map<string, Permission[]>();

    this.permissions.forEach(permission => {
      if (!moduleMap.has(permission.module)) {
        moduleMap.set(permission.module, []);
      }
      moduleMap.get(permission.module)!.push(permission);
    });

    this.permissionModules = Array.from(moduleMap.entries()).map(([module, permissions]) => ({
      module,
      permissions,
      isExpanded: false
    }));

    this.moduleOptions = [
      { value: '', label: 'Tous les modules' },
      ...Array.from(moduleMap.keys()).map(module => ({
        value: module,
        label: module.charAt(0).toUpperCase() + module.slice(1)
      }))
    ];
  }

  private buildUserPermissionViews(): void {
    this.userPermissions = this.users.map(user => {
      const currentGroups = user.groups || [];
      const availableGroups = this.groups.filter(group =>
        !currentGroups.some(ug => ug._id === group._id)
      );

      // Get inherited permissions from groups
      const inheritedPermissions: Permission[] = [];
      currentGroups.forEach(group => {
        group.permissions?.forEach(permission => {
          if (!inheritedPermissions.some(p => p._id === permission._id)) {
            inheritedPermissions.push(permission);
          }
        });
      });

      return {
        user,
        currentGroups,
        availableGroups,
        directPermissions: [], // Direct permissions would be loaded separately if supported
        inheritedPermissions,
        isExpanded: false,
        hasChanges: false,
        pendingGroups: [],
        pendingPermissions: []
      };
    });
  }

  // Filter and search methods
  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  filterUsers(): void {
    // Implementation for filtering users based on search term and filters
    this.buildUserPermissionViews();
  }

  onGroupFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onPlatformFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  // Tab and view management
  switchTab(tab: 'users' | 'groups' | 'permissions'): void {
    this.activeTab = tab;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'matrix' : 'list';
  }

  // User permission management
  toggleUserExpansion(userView: UserPermissionView): void {
    userView.isExpanded = !userView.isExpanded;
  }

  addGroupToUser(userView: UserPermissionView, groupId: any): void {
    groupId = groupId.value;
    const group = this.groups.find(g => g._id === groupId);
    if (group && !userView.pendingGroups.includes(groupId)) {
      userView.pendingGroups.push(groupId);
      userView.hasChanges = true;
    }
  }

  removeGroupFromUser(userView: UserPermissionView, groupId: string): void {
    const index = userView.pendingGroups.indexOf(groupId);
    if (index > -1) {
      userView.pendingGroups.splice(index, 1);
    } else {
      // Mark for removal if it's a current group
      const currentGroup = userView.currentGroups.find(g => g._id === groupId);
      if (currentGroup) {
        userView.pendingGroups.push(`-${groupId}`); // Prefix with - for removal
      }
    }
    userView.hasChanges = true;
  }

  async saveUserPermissions(userView: UserPermissionView): Promise<void> {
    if (!userView.hasChanges) return;

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const groupsToAdd = userView.pendingGroups.filter(g => !g.startsWith('-'));
      const groupsToRemove = userView.pendingGroups
        .filter(g => g.startsWith('-'))
        .map(g => g.substring(1));

      const requestData = {
        uid,
        userId: userView.user._id,
        addGroups: groupsToAdd,
        removeGroups: groupsToRemove,
        addPermissions: userView.pendingPermissions,
        removePermissions: []
      };

      this.apiService.post('permissions/update-user-permissions', requestData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Permissions mises à jour avec succès');
              userView.hasChanges = false;
              userView.pendingGroups = [];
              userView.pendingPermissions = [];
              this.loadUsers(); // Refresh data
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la mise à jour');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la mise à jour des permissions');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  cancelUserChanges(userView: UserPermissionView): void {
    userView.hasChanges = false;
    userView.pendingGroups = [];
    userView.pendingPermissions = [];
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

  // Bulk operations
  async executeBulkPermissions(): Promise<void> {
    if (!this.bulkPermissionForm.valid || this.selectedUsers.size === 0) {
      this.handleError('Veuillez sélectionner une action et au moins un utilisateur');
      return;
    }

    const action = this.bulkPermissionForm.get('action')?.value;
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
        ...this.bulkPermissionForm.value
      };

      this.apiService.post('permissions/bulk-permissions', requestData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess(`Action exécutée avec succès sur ${userIds.length} utilisateur(s)`);
              this.selectedUsers.clear();
              this.selectAll = false;
              this.bulkPermissionForm.reset();
              this.modalService.dismissAll();
              this.loadUsers();
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de l\'exécution');
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

  // Group management
  async createGroup(): Promise<void> {
    if (!this.groupManagementForm.valid) {
      this.handleError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const formData = { ...this.groupManagementForm.value, uid };

      this.apiService.post('permissions/create-group', formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Groupe créé avec succès');
              this.groupManagementForm.reset();
              this.modalService.dismissAll();
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la création');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la création du groupe');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  async updateGroup(group: Group): Promise<void> {
    // Implementation for updating a group
  }

  async deleteGroup(group: Group): Promise<void> {
    const confirmed = await this.showConfirmation(
      'Supprimer le groupe',
      `Êtes-vous sûr de vouloir supprimer le groupe "${group.name}" ?`,
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

      this.apiService.post('permissions/delete-group', { id: group._id, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Groupe supprimé avec succès');
              this.loadUsers();
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la suppression');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la suppression du groupe');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  // Permission management
  get permissionControls(): FormArray {
    return this.permissionForm.get('permissions') as FormArray;
  }

  addPermissionControl(): void {
    const control = this.fb.control('', [Validators.required]);
    this.permissionControls.push(control);
  }

  removePermissionControl(index: number): void {
    this.permissionControls.removeAt(index);
  }

  async createPermission(): Promise<void> {
    if (!this.permissionForm.valid) {
      this.handleError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const formData = { ...this.permissionForm.value, uid };

      this.apiService.post('permissions/create-permission', formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Permission créée avec succès');
              this.permissionForm.reset();
              this.modalService.dismissAll();
              this.loadPermissions();
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la création');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la création de la permission');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  // Utility methods
  getGroupBadgeClass(platform: Platform): string {
    switch (platform) {
      case Platform.ADMIN: return 'bg-primary';
      case Platform.PHARMACY: return 'bg-success';
      case Platform.DELIVER: return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getPermissionDescription(permission: Permission): string {
    return permission.description || permission.label || 'Aucune description';
  }

  hasUserChanges(): boolean {
    return this.userPermissions.some(uv => uv.hasChanges);
  }

  getUsersWithChanges(): number {
    return this.userPermissions.filter(uv => uv.hasChanges).length;
  }

  // Pagination
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  getPaginationArray(): number[] {
    const maxVisible = 5;
    const start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Form validation helpers
  getFieldError(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'Ce champ est obligatoire';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      return 'Format invalide';
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

  // Modal helpers
  openBulkPermissionModal(): void {
    this.modalService.dismissAll('ok');
    if (this.selectedUsers.size === 0) {
      this.handleError('Veuillez sélectionner au moins un utilisateur');
      return;
    }
    // this.bulkPermissionForm.reset();
    this.bulkPermissionForm.patchValue({ isActive: true });
    setTimeout(() => {
      this.modalService.open(this.bulkPermissionModal, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }

  openGroupManagementModal(): void {
    this.modalService.dismissAll('ok');
    this.groupManagementForm.reset();
    this.groupManagementForm.patchValue({ isActive: true });
    setTimeout(() => {
      this.modalService.open(this.groupManagementModal, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }

  openPermissionModal(): void {
    this.modalService.dismissAll('ok');
    this.permissionForm.reset();
    // Clear the permissions FormArray
    while (this.permissionControls.length > 0) {
      this.permissionControls.removeAt(0);
    }
    // Add one initial permission control
    this.addPermissionControl();
    setTimeout(() => {
      this.modalService.open(this.permissionModal, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }

  // Error handling
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

  trackByUserId(index: number, userView: UserPermissionView): string {
    return userView.user._id || index.toString();
  }

  trackByGroupId(index: number, group: Group): string {
    return group._id || index.toString();
  }

  trackByPermissionId(index: number, permission: Permission): string {
    return permission._id || index.toString();
  }

  checkPermission(userView, group) {
    return userView.currentGroups.some(ug => ug._id === group._id)
  }
}
