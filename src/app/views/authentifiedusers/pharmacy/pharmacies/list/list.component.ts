import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../controllers/services/auth.service";
import { PharmacyClass } from "../../../../../models/Pharmacy.class";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import {FormBuilder, FormGroup, FormsModule, Validators} from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import { GoogleMapsModule } from '@angular/google-maps';
import {CommonFunctions} from "../../../../../controllers/comonsfunctions";
import {UserDetails} from "../../../../../models/UserDatails";

@Component({
  selector: 'app-pharmacy-list-pharmacies',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, GoogleMapsModule],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})

export class PharmacyListComponentPharmacie implements OnInit, OnDestroy {
  pharmacies: PharmacyClass[] = [];
  filteredPharmacies: PharmacyClass[] = [];
  selectedPharmacy: PharmacyClass | null = null;

  searchText: string = '';
  regionFilter: string = '';
  statusFilter: string = '';
  sortColumn: string = 'name';
  sortDirection: string = 'asc';

  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginationStart: number = 0;
  paginationEnd: number = 0;
  private modalService: NgbModal;
  canIEdit : boolean = false;

  regions: string[] = [];
  private detailsModal: any;

  partnerForm: FormGroup;
  isSubmitting: boolean = false;
  messageNotification: string;

  private destroy$ = new Subject<void>();

  // Loading state
  isLoading: boolean = false;
  @ViewChild('userInfoModal') userInfoModal: ElementRef | undefined;
  @ViewChild('addPharmacy') addPharmacy: ElementRef | undefined;
  @ViewChild('showInfo') showInfo: ElementRef | undefined;
  public currentPage: number = 1;
  userDetail: UserDetails;

  constructor(
    modalService: NgbModal,
    private auth: AuthService,
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder,
) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
    this.modalService = modalService;
    this.partnerForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadPharmacies();
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
        this.userDetail = this.auth.getUserDetails();
        if (loaded && this.userDetail) {
          this.loadPharmacies();
        }
        if (this.userDetail?.onlyShowListPharm) {
          this.messageNotification = "Une ou plusieurs de vos pharmacies sont en attente de compléments d'informations. Veuillez compléter toutes les informations requises pour poursuivre le processus d'enregistrement.\n";          this.openShowMsg();
        }
      });
  }
  createForm(): FormGroup {
    const commonFields = {
      pharmacy_name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      pharmacy_address: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]],
      pharmacy_phone: ['', [
        Validators.required,
        Validators.pattern(/^\+33[0-9]{9}$/)
      ]],
      pharmacy_email: ['', [
        Validators.required,
        Validators.email
      ]],
      // owner_email: ['', [
      //   Validators.required,
      //   Validators.email
      // ]]
    };
    return this.fb.group(commonFields);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  async loadPharmacies(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      this.loadingService.setLoading(true);
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

      this.apiService.post('pharmacy-managment/pharmacies/list', { uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.pharmacies = response.data.map((item: any) => CommonFunctions.mapToPharmacy(item));
              // this.extractRegions();
              this.filterPharmacies();
            } else {
              this.pharmacies = [];
              this.filterPharmacies();
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des pharmacies');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produiteee');
      this.loadingService.setLoading(false);
    }
  }
  filterPharmacies(): void {
    let filtered = [...this.pharmacies];

    if (this.searchText) {
      const searchTerms = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchTerms) ||
        p.address?.toLowerCase().includes(searchTerms) ||
        p.licenseNumber?.toLowerCase().includes(searchTerms) ||
        p.siret?.toLowerCase().includes(searchTerms) ||
        p.phoneNumber?.toLowerCase().includes(searchTerms) ||
        p.email?.toLowerCase().includes(searchTerms)
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    filtered = this.sortPharmacies(filtered);

    this.filteredPharmacies = filtered;
    this.totalPages = Math.max(1, Math.ceil(this.filteredPharmacies.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updatePaginationInfo();
  }
  sortPharmacies(pharmacies: PharmacyClass[]): PharmacyClass[] {
    return pharmacies.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      aValue = this.getPropertyValue(a, this.sortColumn);
      bValue = this.getPropertyValue(b, this.sortColumn);

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (this.sortColumn === 'registerDate' || this.sortColumn === 'suspensionDate') {
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
      this.filteredPharmacies.length
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
    this.filterPharmacies();
  }
  exportPharmaciesList(): void {
    try {
      const headers = ['Nom', 'Adresse', 'Région', 'Date d\'inscription', 'Statut', 'Email', 'Téléphone'];

      // Create CSV content
      let csvContent = headers.join(',') + '\n';

      this.filteredPharmacies.forEach(pharmacy => {
        const row = [
          this.escapeCsvValue(pharmacy.name),
          this.escapeCsvValue(pharmacy.address),
          this.escapeCsvValue(pharmacy.registerDate ? new Date(pharmacy.registerDate).toLocaleDateString() : ''),
          this.escapeCsvValue(this.getStatusLabel(pharmacy.status)),
          this.escapeCsvValue(pharmacy.email || ''),
          this.escapeCsvValue(pharmacy.phoneNumber || '')
        ];
        csvContent += row.join(',') + '\n';
      });

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `pharmacies_${new Date().toISOString().split('T')[0]}.csv`);
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
  viewPharmacyDetails(pharmacy: PharmacyClass): void {
    this.modalService.dismissAll('ok');
    if (pharmacy) {
      this.selectedPharmacy = pharmacy;
      setTimeout(() => {
        this.modalService.open(this.userInfoModal, {
          size: 'xl',
          backdrop: 'static',
          // keyboard: false,
          centered: true
        });
      }, 0);
    }else{
      alert('putain')
    }
  }
  openShowMsg(): void {
    this.modalService.dismissAll('ok');
    setTimeout(() => {
      this.modalService.open(this.showInfo, {
        size: 'xl',
        backdrop: 'static',
        // keyboard: false,
        centered: true
      });
    }, 0);
  }
  openCreateModal() {
    this.modalService.dismissAll('ok');
    setTimeout(() => {
      this.modalService.open(this.addPharmacy, {
        size: 'xl',
        backdrop: 'static',
        // keyboard: false,
        centered: true
      });
    }, 0);
    this.updateProgressBar();
  }
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'suspended': return 'Suspendu';
      case 'inactive': return 'Inactif';
      case 'deleted': return 'Supprimé';
      case 'rejected': return 'Inscription Rejeté';
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
  async approvePharmacy(pharmacy: PharmacyClass): Promise<void> {
    try {
      const confirmed = await this.showConfirmation(
        'Approuver la pharmacie',
        `Êtes-vous sûr de vouloir approuver la pharmacie "${pharmacy.name}" ?`,
        'Approuver'
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

      this.apiService.post('pharmacy-managment/pharmacies/approve', { id: pharmacy.id, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            pharmacy.status = 'active';
            this.filterPharmacies();
            this.showSuccess('Pharmacie approuvée avec succès');

            // Close modal if it's open
            if (this.selectedPharmacy?.id === pharmacy.id && this.detailsModal) {
              this.detailsModal.hide();
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de l\'approbation de la pharmacie');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }
  async suspendPharmacy(pharmacy: PharmacyClass): Promise<void> {
    try {
      const confirmed = await this.showConfirmation(
        'Suspendre la pharmacie',
        `Êtes-vous sûr de vouloir suspendre la pharmacie "${pharmacy.name}" ?`,
        'Suspendre'
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

      this.apiService.post('pharmacy-managment/pharmacies/suspend', { id: pharmacy.id, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            pharmacy.status = 'suspended';
            pharmacy.suspensionDate = new Date();
            this.filterPharmacies();
            this.showSuccess('Pharmacie suspendue avec succès');

            // Close modal if it's open
            if (this.selectedPharmacy?.id === pharmacy.id && this.detailsModal) {
              this.detailsModal.hide();
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la suspension de la pharmacie');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }
  async activatePharmacy(pharmacy: PharmacyClass): Promise<void> {
    try {
      const confirmed = await this.showConfirmation(
        'Réactiver la pharmacie',
        `Êtes-vous sûr de vouloir réactiver la pharmacie "${pharmacy.name}" ?`,
        'Réactiver'
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

      this.apiService.post('pharmacy-managment/pharmacies/activate', { id: pharmacy.id, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            pharmacy.status = 'active';
            pharmacy.suspensionDate = null;
            pharmacy.suspensionReason = null;
            this.filterPharmacies();
            this.showSuccess('Pharmacie réactivée avec succès');

            // Close modal if it's open
            if (this.selectedPharmacy?.id === pharmacy.id && this.detailsModal) {
              this.detailsModal.hide();
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la réactivation de la pharmacie');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }
  // async deletePharmacy(pharmacy: PharmacyClass): Promise<void> {
  //   try {
  //     const confirmed = await this.showConfirmation(
  //       'Supprimer la pharmacie',
  //       `Êtes-vous sûr de vouloir supprimer la pharmacie "${pharmacy.name}" ? Cette action est irréversible.`,
  //       'Supprimer'
  //     );
  //
  //     if (!confirmed) return;
  //
  //     const token = await this.auth.getRealToken();
  //     const uid = await this.auth.getUid();
  //     if (!token) {
  //       this.handleError('Vous n\'êtes pas autorisé à effectuer cette action');
  //       return;
  //     }
  //
  //     const headers = new HttpHeaders({
  //       'Authorization': `Bearer ${token}`,
  //       'Accept': 'application/json',
  //       'Content-Type': 'application/json'
  //     });
  //
  //     this.apiService.post('pharmacy-managment/pharmacies/delete', {id : pharmacy.id, uid}, headers)
  //       .pipe(takeUntil(this.destroy$))
  //       .subscribe({
  //         next: (response: any) => {
  //           const index = this.pharmacies.findIndex(p => p.id === pharmacy.id);
  //           if (index > -1) {
  //             this.pharmacies.splice(index, 1);
  //             this.filterPharmacies();
  //             this.showSuccess('Pharmacie supprimée avec succès');
  //
  //             // Close modal if it's open
  //             if (this.selectedPharmacy?.id === pharmacy.id && this.detailsModal) {
  //               this.detailsModal.hide();
  //               this.selectedPharmacy = null;
  //             }
  //           }
  //         },
  //         error: (error) => {
  //           this.handleError('Erreur lors de la suppression de la pharmacie');
  //         }
  //       });
  //   } catch (error) {
  //     this.handleError('Une erreur s\'est produite');
  //   }
  // }
  // contactPharmacy(pharmacy: PharmacyClass): void {
  //   if (!pharmacy.email) {
  //     this.handleError('Adresse e-mail non disponible pour cette pharmacie');
  //     return;
  //   }
  //
  //   window.location.href = `mailto:${pharmacy.email}?subject=Contact depuis la plateforme`;
  // }
  viewDocument(pharmacyId: string, documentType: string): void {
    // try {
    //   // This would typically open the document in a new tab or modal
    //   window.open(`/api/pharmacies/${pharmacyId}/documents/${documentType}`, '_blank');
    // } catch (error) {
    //   this.handleError('Erreur lors de l\'affichage du document');
    // }
  }
  downloadDocument(pharmacyId: string, documentType: string): void {
    try {
      const token = this.auth.getCurrentUser()?.getIdToken(true);
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à télécharger ce document');
        return;
      }

      const link = document.createElement('a');
      link.href = `/api/pharmacies/${pharmacyId}/documents/${documentType}/download`;
      link.target = '_blank';
      link.download = `${documentType}_${pharmacyId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.handleError('Erreur lors du téléchargement du document');
    }
  }
  getPageNumbers(): number[] {
    const result: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        result.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      // Adjust start if we're near the end
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
  updateProgressBar(): void {
    const progressElement = document.getElementById('progressFill');
    if (progressElement) {
      const progress = 100;
      progressElement.style.width = progress + '%';
    }
  }
  validateCurrentStep(): boolean {
    const fieldsToValidate = ['pharmacy_name', 'pharmacy_address', 'pharmacy_phone', 'pharmacy_email'];
    let isValid = true;
    fieldsToValidate.forEach(fieldName => {
      const control = this.partnerForm.get(fieldName);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          isValid = false;
        }
      }
    });
    return isValid;
  }

  closeModal() {
    this.modalService.dismissAll('ok');
  }
  async onSubmit(): Promise<void> {
    if((this.partnerForm.valid && this.validateCurrentStep())) {
      const fullFormData = {
        type_account: 1,
        pharmacy_name: this.partnerForm.value.pharmacy_name,
        pharmacy_address: this.partnerForm.value.pharmacy_address,
        pharmacy_phone: this.partnerForm.value.pharmacy_phone,
        pharmacy_email: this.partnerForm.value.pharmacy_email,
        owner_email: this.userDetail.email,
        uid: await this.auth.getUid(),
      };

      try {
        this.loadingService.setLoading(true);
        const headers = new HttpHeaders({
          // 'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });
        this.apiService.post('pharmacies/check-owner-and-save-info', fullFormData, headers)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: async (response: any) => {
              if (response){
                if (!response.continue || response.error) {
                  this.handleError(response.errorMessage ?? 'Erreur lors de la communication avec le serveur');
                } else {
                  Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: "Felicitations, la pharmacie a ete enregistree avec succes !",
                  });
                  this.closeModal();
                  this.partnerForm = this.createForm();

                  if (this.auth.getUserDetails()) {
                    this.loadPharmacies();
                  }
                }
              } else {
                this.handleError('Erreur lors de la communication avec le serveur');
              }
              this.loadingService.setLoading(false);
            },
            error: (error) => {
              this.handleError('Erreur lors de la communication avec le serveur');
              this.loadingService.setLoading(false);            }
          });
      } catch (error) {
        this.handleError('Une erreur s\'est produite. Veuillez reeassayez!');
        this.loadingService.setLoading(false);
      }
    }else{this.handleError("Veuillez remplir tous les champs obligatoires !"); return;}
  }

  getFieldError(fieldName: string): string {
    const control = this.partnerForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'Ce champ est obligatoire';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      if (control.errors['pattern']) {
        if (fieldName.includes('phone')) return 'Format requis: +33XXXXXXXXX';
        return 'Format invalide';
      }
      if (control.errors['email']) return 'Format email invalide';
      if (control.errors['fullName']) return 'Veuillez saisir le nom complet (minimum 2 mots)';
      if (control.errors['passwordStrength']) return 'Minimum 8 caractères, 1 majuscule et 1 chiffre';
    }

    if (fieldName === 'confirm_password' && this.partnerForm.hasError('passwordMismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }

    return '';
  }
  isFieldValid(fieldName: string): boolean {
    const control = this.partnerForm.get(fieldName);
    return control ? control.valid && control.touched : false;
  }
  isFieldInvalid(fieldName: string): boolean {
    const control = this.partnerForm.get(fieldName);
    if (fieldName === 'confirm_password' && this.partnerForm.hasError('passwordMismatch')) {
      return true;
    }
    return control ? control.invalid && control.touched : false;
  }

}
