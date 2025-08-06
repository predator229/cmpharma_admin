import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../controllers/services/auth.service";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
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
import { Country } from "../../../../../models/Country.class";
import { PharmacyClass } from "../../../../../models/Pharmacy.class";
import { CommonFunctions } from "../../../../../controllers/comonsfunctions";
import {ActivityTimelineComponent} from "../../../sharedComponents/activity-timeline/activity-timeline.component";
import {ActivityLoged} from "../../../../../models/Activity.class";

interface UserActivityLog {
  action: string;
  timestamp: Date;
  description: string;
  ip?: string;
  userAgent?: string;
}

interface SecurityAudit {
  lastPasswordChange: Date;
  failedLoginAttempts: number;
  lastSuccessfulLogin: Date;
  accountLockHistory: Array<{lockedAt: Date, unlockedAt?: Date, reason: string}>;
  twoFactorEnabled: boolean;
}

@Component({
  selector: 'app-pharmacy-user-detail',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, Select2, ActivityTimelineComponent],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class PharmacyUserDetailComponent implements OnInit, OnDestroy {
  // User data
  user: Admin | null = null;
  userId: string = '';
  originalUser: Admin | null = null;
  hasChanges: boolean = false;

  // Related data
  groups: Group[] = [];
  allPermissions: Permission[] = [];
  userActivityLogs: UserActivityLog[] = [];
  securityAudit: SecurityAudit | null = null;
  managedPharmacies: PharmacyClass[] = [];
  availableGroups: Group[] = [];
  countries: Country[] = [];

  // Loading states
  isLoading: boolean = false;
  isSaving: boolean = false;
  isLoadingActivity: boolean = false;
  isLoadingSecurity: boolean = false;

  // Forms
  profileForm: FormGroup;
  securityForm: FormGroup;
  permissionsForm: FormGroup;
  passwordForm: FormGroup;

  // View states
  activeTab: 'profile' | 'permissions' | 'security' | 'activity' | 'pharmacies' | 'historiques' = 'profile';
  editMode: boolean = false;
  showSensitiveInfo: boolean = false;
  usersActivities: ActivityLoged[] = [];
  usersInfo: { [key: string]:{  name: string;  img: string;  } } | null = null;

  // Permissions
  permissions = {
    viewUser: false,
    editUser: false,
    editPermissions: false,
    viewSecurity: false,
    resetPassword: false,
    viewActivity: false,
    managePharmacies: false,
  };

  // Data for selects
  groupOptions: Array<{value: string, label: string}> = [];
  countryOptions: Array<{value: string, label: string}> = [];
  pharmacyOptions: Array<{value: string, label: string}> = [];

  private destroy$ = new Subject<void>();
  userDetail: UserDetails;

  @ViewChild('resetPasswordModal') resetPasswordModal: ElementRef | undefined;
  @ViewChild('changePhotoModal') changePhotoModal: ElementRef | undefined;
  @ViewChild('auditLogModal') auditLogModal: ElementRef | undefined;

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
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.userId = params['id'];
      if (this.userId) {
        this.auth.userDetailsLoaded$
          .pipe(takeUntil(this.destroy$))
          .subscribe(async loaded => {
            this.userDetail = this.auth.getUserDetails();
            this.setPermissions();
            if (loaded && this.userDetail) {
              await this.loadUserDetail();
            }
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setPermissions(): void {
    this.permissions.viewUser = this.userDetail.hasPermission('utilisateurs.view');
    this.permissions.editUser = this.userDetail.hasPermission('utilisateurs.edit');
    this.permissions.editPermissions = this.userDetail.hasPermission('utilisateurs.permissions');
    this.permissions.viewSecurity = this.userDetail.hasPermission('utilisateurs.security');
    this.permissions.resetPassword = this.userDetail.hasPermission('utilisateurs.password');
    this.permissions.viewActivity = this.userDetail.hasPermission('utilisateurs.activity');
    this.permissions.managePharmacies = this.userDetail.hasPermission('pharmacies.assign');
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      surname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[+]?[0-9]{8,15}$/)]],
      country: [''],
      city: [''],
      address: [''],
      isActivated: [true],
      disabled: [false]
    });

    this.securityForm = this.fb.group({
      twoFactorEnabled: [false],
      requirePasswordChange: [false],
      accountLocked: [false],
      failedLoginAttempts: [0]
    });

    this.permissionsForm = this.fb.group({
      groups: [[]],
      directPermissions: [[]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      sendEmail: [true]
    }, { validators: this.passwordMatchValidator });

    // Track form changes
    this.profileForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkForChanges();
    });

    this.permissionsForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkForChanges();
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  private async loadUserDetail(): Promise<void> {
    this.isLoading = true;
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé');
        this.router.navigate(['pharmacy/users']);
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const params = { uid, userId: this.userId };

      this.apiService.post('pharmacy-management/users/detail', params, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data && !response.error) {
              this.user = new Admin(response.data.user);
              this.loaduserActivities(this.user._id);
              this.originalUser = new Admin(response.data.user);

              // Load related data
              this.groups = response.data.groups?.map((g: any) => new Group(g)) || [];
              this.allPermissions = response.data.permissions?.map((p: any) => new Permission(p)) || [];
              this.managedPharmacies = this.user.pharmaciesManaged?.map((p: any) => CommonFunctions.mapToPharmacy(p)) || [];
              this.countries = response.data.countries?.map((c: any) => new Country(c)) || [];

              this.buildSelectOptions();
              this.populateForms();

              // Load additional data based on permissions
              if (this.permissions.viewActivity) {
                this.loadUserActivity();
              }
              if (this.permissions.viewSecurity) {
                this.loadSecurityAudit();
              }
            } else {
              this.handleError(response.errorMessage || 'Utilisateur non trouvé');
              // this.router.navigate(['pharmacy/users']);
            }
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement de l\'utilisateur');
            // this.router.navigate(['pharmacy/users']);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      // this.router.navigate(['pharmacy/users']);
    } finally {
      this.isLoading = false;
    }
  }

  private buildSelectOptions(): void {
    this.groupOptions = this.groups.map(group => ({
      value: group._id!,
      label: `${group.name} (${group.plateform})`
    }));

    this.countryOptions = this.countries.map(country => ({
      value: country._id!,
      label: country.name
    }));

    this.pharmacyOptions = this.managedPharmacies.map(pharmacy => ({
      value: pharmacy.id,
      label: pharmacy.name
    }));

    this.availableGroups = this.groups.filter(group =>
      !this.user?.groups.some(ug => ug._id === group._id)
    );
  }

  private populateForms(): void {
    if (!this.user) return;

    this.profileForm.patchValue({
      name: this.user.name,
      surname: this.user.surname,
      email: this.user.email,
      phone: this.user.phone?.digits,
      country: this.user.country?._id,
      city: this.user.city,
      address: this.user.address,
      isActivated: this.user.isActivated,
      disabled: this.user.disabled
    });

    this.securityForm.patchValue({
      twoFactorEnabled: this.user.twoFactorEnabled,
      accountLocked: this.user.isAccountLocked(),
      failedLoginAttempts: this.user.failedLoginAttempts
    });

    this.permissionsForm.patchValue({
      groups: this.user.groups.map(g => g._id)
    });
  }

  private checkForChanges(): void {
    if (!this.user || !this.originalUser) return;

    const profileChanges = this.hasFormChanges(this.profileForm, {
      name: this.originalUser.name,
      surname: this.originalUser.surname,
      email: this.originalUser.email,
      phone: this.originalUser.phone?.digits,
      country: this.originalUser.country?._id,
      city: this.originalUser.city,
      address: this.originalUser.address,
      isActivated: this.originalUser.isActivated,
      disabled: this.originalUser.disabled
    });

    const permissionChanges = this.hasFormChanges(this.permissionsForm, {
      groups: this.originalUser.groups.map(g => g._id)
    });

    this.hasChanges = profileChanges || permissionChanges;
  }

  private hasFormChanges(form: FormGroup, originalValues: any): boolean {
    const currentValues = form.value;
    return JSON.stringify(currentValues) !== JSON.stringify(originalValues);
  }

  private async loadUserActivity(): Promise<void> {
    if (!this.permissions.viewActivity) return;

    this.isLoadingActivity = true;
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('pharmacy-management/users/activity', { uid, userId: this.userId }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data && !response.error) {
              this.userActivityLogs = response.data.activities || [];
            }
          },
          error: (error) => {
            console.error('Erreur lors du chargement de l\'activité:', error);
          }
        });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité:', error);
    } finally {
      this.isLoadingActivity = false;
    }
  }

  private async loadSecurityAudit(): Promise<void> {
    if (!this.permissions.viewSecurity) return;

    this.isLoadingSecurity = true;
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('pharmacy-management/users/security-audit', { uid, userId: this.userId }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data && !response.error) {
              this.securityAudit = response.data.audit;
            }
          },
          error: (error) => {
            console.error('Erreur lors du chargement de l\'audit sécurité:', error);
          }
        });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'audit sécurité:', error);
    } finally {
      this.isLoadingSecurity = false;
    }
  }

  // Tab navigation
  switchTab(tab: 'profile' | 'permissions' | 'security' | 'activity' | 'pharmacies' | 'historiques'): void {
    if (this.hasChanges) {
      this.showDiscardChangesDialog().then(confirmed => {
        if (confirmed) {
          this.discardChanges();
          this.activeTab = tab;
        }
      });
    } else {
      this.activeTab = tab;
    }
  }

  // Edit mode
  toggleEditMode(): void {
    if (this.editMode && this.hasChanges) {
      this.showDiscardChangesDialog().then(confirmed => {
        if (confirmed) {
          this.discardChanges();
          this.editMode = false;
        }
      });
    } else {
      this.editMode = !this.editMode;
      if (this.editMode) {
        this.populateForms();
      }
    }
  }

  private async showDiscardChangesDialog(): Promise<boolean> {
    const result = await Swal.fire({
      title: 'Modifications non sauvegardées',
      text: 'Vous avez des modifications non sauvegardées. Voulez-vous les abandonner ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Abandonner',
      cancelButtonText: 'Continuer l\'édition',
      confirmButtonColor: '#d33'
    });
    return result.isConfirmed;
  }

  private discardChanges(): void {
    this.populateForms();
    this.hasChanges = false;
  }

  // Save operations
  async saveProfile(): Promise<void> {
    if (!this.profileForm.valid || !this.user) return;

    this.isSaving = true;
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const formData = {
        uid,
        userId: this.userId,
        ...this.profileForm.value
      };

      this.apiService.post('pharmacy-management/users/update-profile', formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Profil mis à jour avec succès');
              this.user = new Admin(response.data.user);
              this.originalUser = new Admin(response.data.user);
              this.populateForms();
              this.hasChanges = false;
              this.editMode = false;
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la mise à jour');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la mise à jour du profil');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    } finally {
      this.isSaving = false;
    }
  }

  async savePermissions(): Promise<void> {
    if (!this.permissionsForm.valid || !this.user) return;

    this.isSaving = true;
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const formData = {
        uid,
        userId: this.userId,
        groups: this.permissionsForm.get('groups')?.value || [],
        directPermissions: this.permissionsForm.get('directPermissions')?.value || []
      };

      this.apiService.post('pharmacy-management/users/update-permissions', formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Permissions mises à jour avec succès');
              this.user = new Admin(response.data.user);
              this.originalUser = new Admin(response.data.user);
              this.buildSelectOptions();
              this.populateForms();
              this.hasChanges = false;
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
    } finally {
      this.isSaving = false;
    }
  }

  // Password reset
  async resetPassword(): Promise<void> {
    if (!this.passwordForm.valid) return;

    const confirmed = await this.showConfirmation(
      'Réinitialiser le mot de passe',
      'Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ?',
      'Réinitialiser'
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

      const formData = {
        uid,
        userId: this.userId,
        ...this.passwordForm.value
      };

      this.apiService.post('pharmacy-management/users/reset-password', formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Mot de passe réinitialisé avec succès');
              this.passwordForm.reset();
              this.passwordForm.patchValue({ sendEmail: true });
              this.modalService.dismissAll();
              if (this.permissions.viewSecurity) {
                this.loadSecurityAudit();
              }
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la réinitialisation');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la réinitialisation du mot de passe');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  // Account actions
  async toggleAccountStatus(): Promise<void> {
    if (!this.user) return;

    const action = this.user.disabled ? 'activer' : 'désactiver';
    const confirmed = await this.showConfirmation(
      `${action.charAt(0).toUpperCase() + action.slice(1)} le compte`,
      `Êtes-vous sûr de vouloir ${action} le compte de ${this.user.getFullName()} ?`,
      action.charAt(0).toUpperCase() + action.slice(1)
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

      this.apiService.post('pharmacy-management/users/toggle-status', {
        uid,
        userId: this.userId,
        disabled: !this.user.disabled
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess(`Compte ${action} avec succès`);
              this.user!.disabled = !this.user!.disabled;
              this.originalUser!.disabled = this.user!.disabled;
              this.populateForms();
            } else {
              this.handleError(response.errorMessage || `Erreur lors de l'${action}`);
            }
          },
          error: (error) => {
            this.handleError(`Erreur lors de l'${action} du compte`);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  async unlockAccount(): Promise<void> {
    if (!this.user) return;

    const confirmed = await this.showConfirmation(
      'Débloquer le compte',
      `Êtes-vous sûr de vouloir débloquer le compte de ${this.user.getFullName()} ?`,
      'Débloquer'
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

      this.apiService.post('pharmacy-management/users/unlock-account', {
        uid,
        userId: this.userId
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Compte débloqué avec succès');
              if (this.permissions.viewSecurity) {
                this.loadSecurityAudit();
              }
            } else {
              this.handleError(response.errorMessage || 'Erreur lors du déblocage');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors du déblocage du compte');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  // Utility methods
  getStatusBadgeClass(): string {
    if (!this.user) return 'bg-secondary';
    return this.user.getStatusBadgeClass();
  }

  getStatusLabel(): string {
    if (!this.user) return 'Inconnu';
    return this.user.getStatusLabel();
  }

  getRoleBadgeClass(platform: Platform): string {
    switch (platform) {
      case Platform.ADMIN: return 'bg-primary';
      case Platform.PHARMACY: return 'bg-success';
      case Platform.DELIVER: return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getInheritedPermissions(): Permission[] {
    if (!this.user) return [];

    const inherited: Permission[] = [];
    this.user.groups.forEach(group => {
      group.permissions?.forEach(permission => {
        if (!inherited.some(p => p._id === permission._id)) {
          inherited.push(permission);
        }
      });
    });
    return inherited;
  }

  getPermissionDescription(permission: Permission): string {
    return permission.description || permission.label || 'Aucune description';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPasswordStrengthClass(): string {
    if (!this.user?.passwordLastChanged) return 'text-danger';

    const daysSinceChange = this.user.getPasswordAge();
    if (daysSinceChange < 30) return 'text-success';
    if (daysSinceChange < 60) return 'text-warning';
    return 'text-danger';
  }

  getPasswordStrengthText(): string {
    if (!this.user?.passwordLastChanged) return 'Jamais changé';

    const daysSinceChange = this.user.getPasswordAge();
    if (daysSinceChange < 30) return 'Récent';
    if (daysSinceChange < 60) return 'À changer bientôt';
    return 'À changer urgently';
  }

  // Form validation helpers
  getFieldError(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'Ce champ est obligatoire';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      if (control.errors['email']) return 'Format d\'email invalide';
      if (control.errors['pattern']) return 'Format invalide';
      if (control.errors['mismatch']) return 'Les mots de passe ne correspondent pas';
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

  // Modal operations
  openResetPasswordModal(): void {
    if (!this.permissions.resetPassword) {
      this.handleError('Vous n\'avez pas les permissions pour réinitialiser le mot de passe');
      return;
    }
    this.passwordForm.reset();
    this.passwordForm.patchValue({ sendEmail: true });
    this.modalService.open(this.resetPasswordModal, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });
  }

  openAuditLogModal(): void {
    this.modalService.open(this.auditLogModal, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
  }

  // Navigation
  goBack(): void {
    if (this.hasChanges) {
      this.showDiscardChangesDialog().then(confirmed => {
        if (confirmed) {
          this.router.navigate(['pharmacy/users/list']);
        }
      });
    } else {
      this.router.navigate(['pharmacy/users/list']);
    }
  }

  editUser(): void {
    // Navigate to edit mode or enable edit mode
    this.toggleEditMode();
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

  // Tracking functions
  trackByGroupId(index: number, group: Group): string {
    return group._id || index.toString();
  }

  trackByPermissionId(index: number, permission: Permission): string {
    return permission._id || index.toString();
  }
// Ajoutez ces méthodes à votre classe PharmacyUserDetailComponent

// Security related methods
  getTwoFactorStatusClass(): string {
    if (!this.user) return 'text-secondary';
    return this.user.twoFactorEnabled ? 'text-success' : 'text-warning';
  }

  getTwoFactorStatusText(): string {
    if (!this.user) return 'Inconnu';
    return this.user.twoFactorEnabled ? 'Activé' : 'Désactivé';
  }

  getFailedAttemptsClass(): string {
    if (!this.user) return 'text-secondary';
    const attempts = this.user.failedLoginAttempts || 0;
    if (attempts === 0) return 'text-success';
    if (attempts < 3) return 'text-warning';
    return 'text-danger';
  }

  getAccountLockStatus(): string {
    if (!this.user) return 'Inconnu';
    if (this.user.isAccountLocked()) {
      return 'Compte bloqué';
    }
    return 'Compte libre';
  }

// Activity related methods
  getActivityBadgeClass(action: string): string {
    switch (action.toLowerCase()) {
      case 'login':
      case 'connexion':
        return 'bg-success';
      case 'logout':
      case 'deconnexion':
        return 'bg-info';
      case 'failed_login':
      case 'echec_connexion':
        return 'bg-warning';
      case 'password_reset':
      case 'reinitialisation_mot_de_passe':
        return 'bg-warning';
      case 'profile_update':
      case 'mise_a_jour_profil':
        return 'bg-primary';
      case 'permission_change':
      case 'changement_permission':
        return 'bg-secondary';
      case 'account_locked':
      case 'compte_bloque':
        return 'bg-danger';
      case 'account_unlocked':
      case 'compte_debloque':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getActivityIcon(action: string): string {
    switch (action.toLowerCase()) {
      case 'login':
      case 'connexion':
        return 'fa-sign-in-alt';
      case 'logout':
      case 'deconnexion':
        return 'fa-sign-out-alt';
      case 'failed_login':
      case 'echec_connexion':
        return 'fa-exclamation-triangle';
      case 'password_reset':
      case 'reinitialisation_mot_de_passe':
        return 'fa-key';
      case 'profile_update':
      case 'mise_a_jour_profil':
        return 'fa-user-edit';
      case 'permission_change':
      case 'changement_permission':
        return 'fa-shield-alt';
      case 'account_locked':
      case 'compte_bloque':
        return 'fa-lock';
      case 'account_unlocked':
      case 'compte_debloque':
        return 'fa-unlock';
      default:
        return 'fa-info-circle';
    }
  }

  trackByActivityId(index: number, activity: UserActivityLog): string {
    return `${activity.timestamp.getTime()}-${index}`;
  }

  trackByPharmacyId(index: number, pharmacy: PharmacyClass): string {
    return pharmacy.id || index.toString();
  }

// Modal management
  closeModal(): void {
    this.modalService.dismissAll();
  }

// Photo management (si vous souhaitez implémenter plus tard)
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        this.handleError('Veuillez sélectionner un fichier image valide');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB max
        this.handleError('La taille du fichier ne doit pas dépasser 5MB');
        return;
      }

      // TODO: Implémenter l'upload de photo
      console.log('Photo sélectionnée:', file);
      // this.uploadUserPhoto(file);
    }
  }

// Export functionality
  async exportUserData(): Promise<void> {
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('pharmacy-management/users/export-data', {
        uid,
        userId: this.userId
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              // Créer et télécharger le fichier
              const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                type: 'application/json'
              });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `user-data-${this.user?.getFullName().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);

              this.showSuccess('Données exportées avec succès');
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de l\'export');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de l\'export des données');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite lors de l\'export');
    }
  }

// Group management (pour l'édition des permissions)
  async removeGroupFromUser(groupId: string): Promise<void> {
    if (!this.user || !this.permissions.editPermissions) return;

    const group = this.user.groups.find(g => g._id === groupId);
    if (!group) return;

    const confirmed = await this.showConfirmation(
      'Retirer le groupe',
      `Êtes-vous sûr de vouloir retirer le groupe "${group.name}" de cet utilisateur ?`,
      'Retirer'
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

      this.apiService.post('pharmacy-management/users/remove-group', {
        uid,
        userId: this.userId,
        groupId: groupId
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Groupe retiré avec succès');
              // Mettre à jour les données locales
              this.user!.groups = this.user!.groups.filter(g => g._id !== groupId);
              this.originalUser!.groups = this.originalUser!.groups.filter(g => g._id !== groupId);
              this.buildSelectOptions();
              this.populateForms();
            } else {
              this.handleError(response.errorMessage || 'Erreur lors de la suppression du groupe');
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

// Utility method pour les validations avancées
  private validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[+]?[0-9]{8,15}$/;
    return phoneRegex.test(phone);
  }

// Méthode pour formater les numéros de téléphone
  formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    // Exemple de formatage simple
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

// Getter pour les statistiques rapides
  getQuickStats() {
    if (!this.user) return {};

    return {
      groupsCount: this.user.groups.length,
      permissionsCount: this.getInheritedPermissions().length,
      pharmaciesCount: this.user.pharmaciesManaged.length,
      lastLogin: this.user.lastLogin ? this.formatDate(this.user.lastLogin) : 'Jamais'
    };
  }

// Méthode pour vérifier si l'utilisateur a des permissions spécifiques
  hasSpecificPermission(permission: string): boolean {
    return this.getInheritedPermissions().some(p =>
      p.permissions.includes(permission)
    );
  }

// Méthode pour obtenir le niveau de sécurité du compte
  getSecurityLevel(): { level: string, class: string, score: number } {
    if (!this.user) return { level: 'Inconnu', class: 'text-secondary', score: 0 };

    let score = 0;

    // 2FA activé (+30 points)
    if (this.user.twoFactorEnabled) score += 30;

    // Mot de passe récent (+20 points)
    const passwordAge = this.user.getPasswordAge();
    if (passwordAge < 30) score += 20;
    else if (passwordAge < 60) score += 10;

    // Pas de tentatives échouées récentes (+20 points)
    if ((this.user.failedLoginAttempts || 0) === 0) score += 20;

    // Compte non bloqué (+15 points)
    if (!this.user.isAccountLocked()) score += 15;

    // Compte activé (+15 points)
    if (this.user.isActivated && !this.user.disabled) score += 15;

    if (score >= 80) return { level: 'Excellent', class: 'text-success', score };
    if (score >= 60) return { level: 'Bon', class: 'text-primary', score };
    if (score >= 40) return { level: 'Moyen', class: 'text-warning', score };
    return { level: 'Faible', class: 'text-danger', score };
  }
  async loaduserActivities(userID: string): Promise<void> {
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

    this.apiService.post('pharmacy-management/users/activities', { id: userID, uid }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.usersActivities = response?.data || [];
          this.usersInfo = response?.usersMap || [];
        },
        error: (error) => {
          this.usersActivities = [];
        }
      });
  }

}
