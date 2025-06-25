import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../theme/shared/shared.module";
import { AuthService } from "../../../../controllers/services/auth.service";
import { PharmacyClass } from "../../../../models/Pharmacy.class";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../controllers/services/api.service';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {Chart, ChartConfiguration} from 'chart.js';
import {CommonFunctions} from "../../../../controllers/comonsfunctions";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {OpeningHoursClass} from "../../../../models/OpeningHours.class";
import { Location } from "../../../../models/Location";
import {MapSelectorComponent} from "../../../map-selector/map-selector.component";

declare var bootstrap: any;
declare var google: any;

@Component({
  selector: 'app-pharmacy-detail-pharmacies',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, ReactiveFormsModule, MapSelectorComponent],
  templateUrl: './_details.component.html',
  styleUrls: ['./_details.component.scss']
})
export class PharmacyDetailComponentPharmacie implements OnInit, OnDestroy {
  pharmacy: PharmacyClass | null = null;
  recentOrders: any[] = [];
  pharmacyActivities: any[] = [];
  commonsFunction: CommonFunctions;
  pharmacyForm: FormGroup;
  contactForm: FormGroup;
  currentDocument: { title: string, url: string | SafeResourceUrl, type: string } = { title: '', url: '', type: '' };

  selectedFiles: {
    logo?: File;
    license?: File;
    idDocument?: File;
    insurance?: File;
  } = {};

  previewUrls: {
    logo?: string;
    license?: string;
    idDocument?: string;
    insurance?: string;
  } = {};

  uploadProgress: {
    logo?: number;
    license?: number;
    idDocument?: number;
    insurance?: number;
  } = {};

  private dayNames = [
    'Lundi', 'Mardi', 'Mercredi', 'Jeudi',
    'Vendredi', 'Samedi', 'Dimanche'
  ];

  private modalRef: NgbModalRef | null = null;

  private deleteModal: any;
  private contactModal: any;
  private documentViewerModal: any;

  private revenueChart: Chart | null = null;
  private map: any = null;

  msgFormInfo: string = 'Veuillez compléter les informations manquantes pour cette pharmacie.';
  messageNotification: string = '';
  showLocationFields: boolean = false;
  isSubmitting: boolean = false;

  @ViewChild('showInfo') showInfo: ElementRef | undefined;
  @ViewChild('formRequiredInfo') formRequiredInfo: ElementRef | undefined;

  private destroy$ = new Subject<void>();
  isLoading = false;

  constructor(
    private modalService: NgbModal,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.pharmacyForm = this.createFormInfoPharmacy();
    this.contactForm = this.fb.group({
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });

    this.commonsFunction = new CommonFunctions();
  }

  ngOnInit(): void {
    this.initializeWorkingHours();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const pharmacyId = params['id'];
      if (pharmacyId) {
        this.loadPharmacyDetails(pharmacyId);
      } else {
        this.router.navigate(['/admin/pharmacies']);
      }
    });

    this.initializeBootstrapModals();

    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
        if (loaded && this.auth.getUserDetails()) {
          if (this.pharmacy) {
            this.loadPharmacyDetails(this.pharmacy.id);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  private initializeBootstrapModals(): void {
    // Utiliser setTimeout pour s'assurer que le DOM est chargé
    setTimeout(() => {
      const deleteModalElement = document.getElementById('deleteConfirmationModal');
      const contactModalElement = document.getElementById('contactModal');
      const documentViewerModalElement = document.getElementById('documentViewerModal');

      if (deleteModalElement) {
        this.deleteModal = new bootstrap.Modal(deleteModalElement);
      }

      if (contactModalElement) {
        this.contactModal = new bootstrap.Modal(contactModalElement);
      }

      if (documentViewerModalElement) {
        this.documentViewerModal = new bootstrap.Modal(documentViewerModalElement);
      }
    }, 100);
  }

  private createFormInfoPharmacy(): FormGroup {
    const form = this.fb.group({
      id: [''],
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      licenseNumber: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      siret: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      latitude: [null],
      longitude: [null],
      suspensionDate: [null],
      suspensionReason: [''],
      comentaire: [''],
      workingHours: this.fb.array([]),
      logoFile: [null],
      licenseFile: [null, [Validators.required]],
      idDocumentFile: [null, [Validators.required]],
      insuranceFile: [null, [Validators.required]]
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.patchValue({ latitude, longitude });
        },
        (error) => {
          console.error('Erreur de géolocalisation :', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000
        }
      );
    } else {
      console.warn('La géolocalisation n’est pas supportée par ce navigateur.');
    }
    return form;
  }

  private initializeWorkingHours(): void {
    const workingHoursArray = this.workingHoursFormArray;

    // Vider le FormArray avant d'ajouter
    workingHoursArray.clear();

    for (let i = 0; i < 7; i++) {
      const dayGroup = this.fb.group({
        day: [i + 1],
        open: [false],
        opening: ['09:00'],
        closing: ['18:00']
      });

      workingHoursArray.push(dayGroup);
    }
  }
  get workingHoursFormArray(): FormArray {
    return this.pharmacyForm.get('workingHours') as FormArray;
  }
  getDayName(index: number): string {
    return this.dayNames[index] || '';
  }
  closeModal(): void {
    this.modalService.dismissAll('ok');
  }

  openShowMsg(): void {
    this.closeModal(); // Fermer toute modale ouverte
      this.modalRef = this.modalService.open(this.showInfo, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
  }
  openFormInfo(): void {
    this.closeModal();
    setTimeout(() => {
      this.modalService.open(this.formRequiredInfo, {
        size: 'xl',
        backdrop: 'static',
        // keyboard: false,
        centered: true
      });
    }, 0);
 }

  onFileSelected(event: any, fileType: string): void {
    const file = event.target.files[0];
    if (file) {
      // Validation du type de fichier
      if (!this.isValidFileType(file, fileType)) {
        this.handleError('Type de fichier non autorisé. Utilisez PDF, JPG, PNG ou JPEG.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.handleError('La taille du fichier ne peut pas dépasser 5MB.');
        return;
      }

      this.selectedFiles[fileType as keyof typeof this.selectedFiles] = file;

      // Créer une URL de prévisualisation pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls[fileType as keyof typeof this.previewUrls] = e.target.result;
        };
        reader.readAsDataURL(file);
      }

      // Mettre à jour le formulaire
      this.pharmacyForm.patchValue({
        [`${fileType}File`]: file
      });
    }
  }
  private isValidFileType(file: File, fileType: string): boolean {
    const allowedTypes = {
      logo: ['image/jpeg', 'image/jpg', 'image/png'],
      license: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      idDocument: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      insurance: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    };

    return allowedTypes[fileType as keyof typeof allowedTypes]?.includes(file.type) || false;
  }

  removeFile(fileType: string): void {
    delete this.selectedFiles[fileType as keyof typeof this.selectedFiles];
    delete this.previewUrls[fileType as keyof typeof this.previewUrls];

    // Réinitialiser le champ du formulaire
    this.pharmacyForm.patchValue({
      [`${fileType}File`]: null
    });

    // Réinitialiser l'input file
    const fileInput = document.getElementById(`${fileType}File`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getFileIcon(fileType: string): string {
    const file = this.selectedFiles[fileType as keyof typeof this.selectedFiles];
    if (!file) return 'fas fa-file';

    if (file.type === 'application/pdf') return 'fas fa-file-pdf';
    if (file.type.startsWith('image/')) return 'fas fa-file-image';
    return 'fas fa-file';
  }

  async loadPharmacyDetails(pharmacyId: string): Promise<void> {
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

      this.apiService.post('pharmacy-managment/pharmacies/details', { id: pharmacyId, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.pharmacy = CommonFunctions.mapToPharmacy(response.data);
              this.loadRecentOrders(pharmacyId);
              this.loadPharmacyActivities(pharmacyId);

              this.loadPharmacyDataIntoForm();

              if (this.pharmacy.status === "pending") {
                this.openFormInfo();
              }

              setTimeout(() => {
                this.initRevenueChart();
                this.initMap();
              }, 500);
            } else {
              this.router.navigate(['/pharmacy/pharmacies']); // Correction: route cohérente
              this.handleError('Pharmacie non trouvée');
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des informations de la pharmacie');
            this.loadingService.setLoading(false);
            this.router.navigate(['/pharmacy/pharmacies']);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  // Correction: Méthode pour charger les données de la pharmacie dans le formulaire
  private loadPharmacyDataIntoForm(): void {
    if (!this.pharmacy) return;

    this.pharmacyForm.patchValue({
      id: this.pharmacy.id,
      name: this.pharmacy.name,
      address: this.pharmacy.address,
      phoneNumber: this.pharmacy.phoneNumber,
      email: this.pharmacy.email,
      licenseNumber: this.pharmacy.licenseNumber,
      siret: this.pharmacy.siret,
      latitude: this.pharmacy.location?.latitude,
      longitude: this.pharmacy.location?.longitude,
      suspensionDate: this.pharmacy.suspensionDate ?
        new Date(this.pharmacy.suspensionDate).toISOString().split('T')[0] : null,
      suspensionReason: this.pharmacy.suspensionReason,
      comentaire: this.pharmacy.comentaire
    });

    // Charger les horaires d'ouverture
    if (this.pharmacy.workingHours && this.pharmacy.workingHours.length > 0) {
      const workingHoursArray = this.workingHoursFormArray;

      this.pharmacy.workingHours.forEach((hour, index) => {
        if (index < workingHoursArray.length) {
          workingHoursArray.at(index).patchValue({
            day: hour.day,
            open: hour.open,
            opening: hour.opening,
            closing: hour.closing
          });
        }
      });
    }

    // Afficher les champs de localisation si nécessaire
    this.showLocationFields = !!(this.pharmacy.location?.latitude && this.pharmacy.location?.longitude);
  }

  private async uploadFiles(): Promise<{[key: string]: string}> {
    const uploadedFiles: {[key: string]: string} = {};
    const token = await this.auth.getRealToken();
    const uid = await this.auth.getUid();

    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    for (const [fileType, file] of Object.entries(this.selectedFiles)) {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', fileType);
        formData.append('pharmacyId', this.pharmacy?.id || '');
        formData.append('uid', uid || '');

        try {
          const response: any = await this.apiService.post('pharmacy-managment/pharmacies/upload-document', formData, headers).toPromise();
          if (response && response.success) {
            uploadedFiles[fileType] = response.data.fileId;
          }
        } catch (error) {
          console.error(`Erreur lors de l'upload du fichier ${fileType}:`, error);
          throw new Error(`Erreur lors de l'upload du fichier ${fileType}`);
        }
      }
    }

    return uploadedFiles;
  }

  private async savePharmacy(pharmacy: PharmacyClass): Promise<void> {
    const token = await this.auth.getRealToken();
    const uid = await this.auth.getUid();

    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    const updateData = {
      ...pharmacy,
      uid
    };

    return new Promise((resolve, reject) => {
      this.apiService.post('pharmacy-managment/pharmacies/update', updateData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.success) {
              this.showSuccess("Pharmacie mise à jour avec succès. Nos administrateurs vont procéder à la vérification des informations fournies. Vous serez notifié par e-mail une fois la validation effectuée.");
              this.loadPharmacyDetails(pharmacy.id);
              resolve();
            } else {
              reject(new Error('Erreur lors de la sauvegarde'));
            }
          },
          error: (error) => {
            reject(error);
          }
        });
    });
  }

  onSubmit(): void {
    if (this.pharmacyForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.pharmacyForm.value;
      const pharmacyData = this.buildPharmacyObject(formValue);

      this.savePharmacy(pharmacyData)
        .then(() => {
          this.closeModal();
        })
        .catch(error => {
          console.error('Erreur lors de la sauvegarde:', error);
          this.handleError('Erreur lors de la sauvegarde des données');
        })
        .finally(() => {
          this.isSubmitting = false;
        });
    } else {
      this.markFormGroupTouched(this.pharmacyForm);
    }
  }

  private buildPharmacyObject(formValue: any): PharmacyClass {
    const location: Location | null = (formValue.latitude && formValue.longitude)
      ? { latitude: formValue.latitude, longitude: formValue.longitude }
      : null;

    const workingHours: OpeningHoursClass[] = formValue.workingHours
      .filter((hour: any) => hour.open)
      .map((hour: any) => new OpeningHoursClass({
        day: hour.day,
        open: hour.open,
        opening: hour.opening,
        closing: hour.closing
      }));

    return new PharmacyClass({
      id: formValue.id || this.generateId(),
      name: formValue.name,
      address: formValue.address,
      phoneNumber: formValue.phoneNumber,
      email: formValue.email,
      status: formValue.status,
      licenseNumber: formValue.licenseNumber,
      siret: formValue.siret,
      location: location,
      suspensionDate: formValue.suspensionDate ? new Date(formValue.suspensionDate) : null,
      suspensionReason: formValue.suspensionReason,
      comentaire: formValue.comentaire,
      workingHours: workingHours,
      registerDate: this.pharmacy?.registerDate || new Date() // Garder la date d'origine
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  private resetForm(): void {
    this.pharmacyForm.reset();
    this.showLocationFields = false;
    this.isSubmitting = false;
    this.initializeWorkingHours();
  }

  private generateId(): string {
    return 'pharmacy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  toggleLocationFields(): void {
    this.showLocationFields = !this.showLocationFields;
  }

  async loadRecentOrders(pharmacyId: string): Promise<void> {
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

    this.apiService.post('orders/recent', { id: pharmacyId, limit: 5, uid }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.recentOrders = response?.data || [];
        },
        error: (error) => {
          this.recentOrders = [];
          console.error('Error loading recent orders', error);
        }
      });
  }

  async loadPharmacyActivities(pharmacyId: string): Promise<void> {
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

    this.apiService.post('pharmacy-managment/pharmacies/activities', { id: pharmacyId, uid }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.pharmacyActivities = response?.data || [];
        },
        error: (error) => {
          this.pharmacyActivities = [];
          console.error('Error loading pharmacy activities', error);
        }
      });
  }

  async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.auth.getRealToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  initRevenueChart(): void {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const data = this.pharmacy?.revenue30days || Array(12).fill(0);

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenus mensuels (€)',
          data: data as number[],
          backgroundColor: 'rgba(21, 101, 192, 0.1)',
          borderColor: '#1565c0',
          borderWidth: 2,
          pointBackgroundColor: '#1565c0',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + ' €';
              }
            }
          }
        }
      }
    } as ChartConfiguration<'line'>);
  }

  initMap(): void {
    if (!this.pharmacy?.location?.latitude || !this.pharmacy?.location?.longitude) return;

    const mapElement = document.getElementById('pharmacyMap');
    if (!mapElement) return;

    const latitude = parseFloat(this.pharmacy.location.latitude.toString());
    const longitude = parseFloat(this.pharmacy.location.longitude.toString());
    const position = { lat: latitude, lng: longitude };

    this.map = new google.maps.Map(mapElement, {
      center: position,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false
    });

    new google.maps.Marker({
      position: position,
      map: this.map,
      title: this.pharmacy.name,
      icon: {
        url: '/assets/images/pharmacy-marker.png',
        scaledSize: new google.maps.Size(40, 40)
      }
    });
  }

  openDeleteConfirmation(): void {
    if (this.deleteModal) {
      this.deleteModal.show();
    }
  }

  openContactModal(): void {
    if (this.contactModal) {
      this.contactForm.reset();
      this.contactModal.show();
    }
  }

  viewDocument(documentType: string): void {
    if (!this.pharmacy) return;

    switch (documentType) {
      case 'license':
        this.currentDocument = {
          title: 'Licence pharmaceutique',
          url: this.sanitizer.bypassSecurityTrustResourceUrl(`/api/pharmacies/${this.pharmacy.id}/documents/license`),
          type: documentType
        };
        break;
      case 'id':
        this.currentDocument = {
          title: 'Pièce d\'identité',
          url: this.sanitizer.bypassSecurityTrustResourceUrl(`/api/pharmacies/${this.pharmacy.id}/documents/id`),
          type: documentType
        };
        break;
      case 'insurance':
        this.currentDocument = {
          title: 'Attestation d\'assurance',
          url: this.sanitizer.bypassSecurityTrustResourceUrl(`/api/pharmacies/${this.pharmacy.id}/documents/insurance`),
          type: documentType
        };
        break;
      default:
        return;
    }

    if (this.documentViewerModal) {
      this.documentViewerModal.show();
    }
  }

  downloadDocument(documentType: string): void {
    if (!this.pharmacy) return;

    try {
      const link = document.createElement('a');
      link.href = `/api/pharmacies/${this.pharmacy.id}/documents/${documentType}/download`;
      link.download = `${documentType}_${this.pharmacy.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.handleError('Erreur lors du téléchargement du document');
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'suspended': return 'Suspendu';
      case 'inactive': return 'Inactif';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  }

  getOrderStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'delivered': return 'delivered';
      case 'shipping': return 'shipping';
      case 'preparing': return 'preparing';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      default: return '';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'status': return 'fas fa-toggle-on';
      case 'order': return 'fas fa-shopping-cart';
      case 'payment': return 'fas fa-credit-card';
      case 'admin': return 'fas fa-user-shield';
      default: return 'fas fa-history';
    }
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
  onMapChange(event: { lat: number; lng: number }) {
    this.pharmacyForm.patchValue({
      latitude: event.lat,
      longitude: event.lng
    });
  }

}
