import {Component, OnInit, OnDestroy, ViewChild, ElementRef, Input} from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../controllers/services/auth.service";
import { PharmacyClass } from "../../../../../models/Pharmacy.class";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import {count, Subject, takeUntil} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { ApiService } from '../../../../../controllers/services/api.service';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import Swal from 'sweetalert2';
import { DomSanitizer } from '@angular/platform-browser';
import {Chart, ChartConfiguration} from 'chart.js';
import {CommonFunctions} from "../../../../../controllers/comonsfunctions";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {OpeningHoursClass} from "../../../../../models/OpeningHours.class";
import { Location } from "../../../../../models/Location";
import {MapSelectorComponent} from "../../../sharedComponents/map-selector/map-selector.component";
import {UserDetails} from "../../../../../models/UserDatails";
import {environment} from "../../../../../../environments/environment";
import {Select2AjaxComponent} from "../../../sharedComponents/select2-ajax/select2-ajax.component";
import {Country} from "../../../../../models/Country.class";
import {ZoneCoordinates} from "../../../../../models/ZoneCoordinates.class";
import {DeliveryZoneClass} from "../../../../../models/DeliveryZone.class";
import {ActivityTimelineComponent} from "../../../sharedComponents/activity-timeline/activity-timeline.component";
import {ActivityLoged} from "../../../../../models/Activity.class";
import {AdminChatComponent} from "../../../sharedComponents/minichat/minichat.component";

declare var bootstrap: any;
declare var google: any;

@Component({
  selector: 'app-pharmacy-detail-pharmacies',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, ReactiveFormsModule, MapSelectorComponent, Select2AjaxComponent, ActivityTimelineComponent, AdminChatComponent],
  templateUrl: './_details.component.html',
  styleUrls: ['./_details.component.scss']
})
export class PharmacyDetailComponentPharmacie implements OnInit, OnDestroy {
  @Input() userDetail!: UserDetails;
  pharmacy: PharmacyClass | null = null;

  internatPathUrl = environment.internalPathUrl;
  baseUrl = environment.baseUrl;
  isLoading = false;
  canIEdit: boolean = false;
  recentOrders: any[] = [];
  pharmacyActivities: ActivityLoged[] = [];
  commonsFunction: CommonFunctions;
  pharmacyForm: FormGroup;
  pharmaciesCustomSave: FormGroup;
  contactForm: FormGroup;
  theDay : OpeningHoursClass | null = null;
  theDayHours : OpeningHoursClass[] | null = null;
  theDayHoursPrevSubmit : OpeningHoursClass[] | null = null;
  usersInfo: { [key: string]:{  name: string;  img: string;  } } | null = null;

  http : HttpClient;
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
  countriesListArray: { [id: string]: Country } | null;

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
  private readonly DEFAULT_WORKING_HOURS = {
    opening: '09:00',
    closing: '18:00',
    open: false
  };
  protected readonly OpeningHoursClass = OpeningHoursClass;
  private destroy$ = new Subject<void>();

  msgFormInfo: string = 'Veuillez compléter les informations manquantes pour cette pharmacie.';
  showLocationFields: boolean = false;
  isSubmitting: boolean = false;

  //modals
  @ViewChild('showInfo') showInfo: ElementRef | undefined;
  @ViewChild('formRequiredInfo') formRequiredInfo: ElementRef | undefined;
  @ViewChild('formGeneralInfos') formGeneralInfos: ElementRef | undefined;
  @ViewChild('formLegalsInfos') formLegalsInfos: ElementRef | undefined;
  @ViewChild('formHorrairesInfos') formHorrairesInfos: ElementRef | undefined;
  @ViewChild('formCoordonatesInfos') formCoordonatesInfos: ElementRef | undefined;
  @ViewChild('formCoordonatesZoneInfos') formCoordonatesZoneInfos: ElementRef | undefined;
  @ViewChild('editOrViewDocument') editOrViewDocument: ElementRef | undefined;

  //select2
  @ViewChild('countrySelect', { static: false }) countrySelect!: ElementRef;

  constructor( private modalService: NgbModal,  private auth: AuthService,  private router: Router,  private route: ActivatedRoute,  private apiService: ApiService,  private loadingService: LoadingService,  private fb: FormBuilder,  private sanitizer: DomSanitizer) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
    this.commonsFunction = new CommonFunctions();
    this.initializecountriesListArray();
  }

  async ngOnInit(): Promise<void> {
    this.initializeBootstrapModals();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(async params => {
      const pharmacyId = params['id'];
      this.userDetail = params['userDetail'];

      if (!this.userDetail) {
        this.auth.userDetailsLoaded$
          .pipe(takeUntil(this.destroy$))
          .subscribe(loaded => {
            this.userDetail = this.auth.getUserDetails();
            if (loaded && !this.userDetail) {
              alert('User details not found');
            }
          });
      }

      if (pharmacyId) {
        await this.loadPharmacyDetails(pharmacyId);
        this.canIEdit = this.userDetail.hasPermission('pharmacies.edit', pharmacyId);

        this.pharmacyForm = this.createFormInfoPharmacy();
        this.initializeWorkingHours();
        this.contactForm = this.fb.group({
          subject: ['', [Validators.required]],
          message: ['', [Validators.required, Validators.minLength(10)]]
        });
      } else {
        this.router.navigate(['/admin/pharmacies']);
      }
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.revenueChart) { this.revenueChart.destroy();}
    if (this.modalRef) { this.modalRef.close();}
  }
  onSubmit(type : number): void {
    let form = this.pharmacyForm;
    switch (type) {
      case 2:
      case 3:
      case 4:
      case 7:
      case 5: form = this.pharmaciesCustomSave; break;
      default: form = this.pharmacyForm; break;
    }
    if (form.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = form.value;
      const pharmacyData = this.buildPharmacyObject(type, formValue);

      this.savePharmacy(pharmacyData)
        .then(() => {
          this.theDayHoursPrevSubmit = this.theDayHours;
          this.closeModal();
        })
        .catch(error => {
          this.handleError(error.message ?? 'Erreur lors de la sauvegarde des données');
        })
        .finally(() => {
          this.isSubmitting = false;
        });
    } else {
      this.markFormGroupTouched(this.pharmacyForm);
    }
  }

  private initializeBootstrapModals(): void {
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
  private initRevenueChart(): void {
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
  private initMap(): void {
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
  private initializeWorkingHours(): void {
    const workingHoursArray = this.workingHoursFormArray;
    if (workingHoursArray != null) { workingHoursArray.clear(); }
    if (this.theDayHours != null && this.theDayHours.length > 0){
      for (let i = 0; i < this.theDayHours.length; i++) {
        const dayGroup = this.fb.group({
          day: [this.theDayHours[i].day],
          open: [this.theDayHours[i].open],
          opening: [this.theDayHours[i].opening],
          closing: [this.theDayHours[i].closing]
        });
        workingHoursArray.push(dayGroup);
      }
    }else{
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
    this.theDayHoursPrevSubmit = this.theDayHours;
  }
  private async initializecountriesListArray(): Promise<void> {
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

      this.apiService.post('tools/get-countries-list', {uid}, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (response: any) => {
            if (response && response.data) {
              this.countriesListArray = response.data;
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
      country: ['',[Validators.required]],
      city: ['',[Validators.required]],
      comentaire: [''],
      logoFile: [null],
      licenseFile: this.pharmacy?.status == "pending" ? [null, [Validators.required]] : [null],
      idDocumentFile: this.pharmacy?.status == "pending" ? [null, [Validators.required]] : [null],
      insuranceFile: this.pharmacy?.status == "pending" ? [null, [Validators.required]] : [null]
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.patchValue({ latitude, longitude });
        },
        (error) => {
        },
        {
          enableHighAccuracy: true,
          timeout: 5000
        }
      );
      this.theDayHoursPrevSubmit = this.theDayHours;
    } else {
    }
    return form;
  }
  private buildPharmacyObject(type : number, formValue: any): PharmacyClass {
    const location: Location | null = [1,5].includes(type) ? ( (formValue.latitude && formValue.longitude)
      ? { latitude: formValue.latitude, longitude: formValue.longitude }
      : null) : ( this.pharmacy.location?.longitude && this.pharmacy.location?.latitude ? {latitude: this.pharmacy.location.latitude, longitude: this.pharmacy.location.longitude} : null);
    const workingHours: OpeningHoursClass[] = [1,4].includes(type) && this.theDayHoursPrevSubmit != null ? this.theDayHoursPrevSubmit : this.theDayHours;

    return new PharmacyClass({
      id: formValue.id || this.generateId(),
      name: formValue.name ?? this.pharmacy.name,
      address: formValue.address ?? this.pharmacy.address,
      phoneNumber: formValue.phoneNumber ?? this.pharmacy.phoneNumber,
      email: formValue.email ?? this.pharmacy.email,
      status: formValue.status ?? this.pharmacy.status,
      licenseNumber: formValue.licenseNumber ?? this.pharmacy.licenseNumber,
      country: formValue.country ?? this.pharmacy.country._id,
      city: formValue.city ?? this.pharmacy.city,
      siret: formValue.siret ?? this.pharmacy.siret,
      location: location,
      suspensionDate: formValue.suspensionDate ? new Date(formValue.suspensionDate) : (this.pharmacy.suspensionDate ? new Date(formValue.suspensionDate) : null ),
      suspensionReason: formValue.suspensionReason ?? this.pharmacy.suspensionReason,
      commentaire: formValue.comentaire ?? this.pharmacy.commentaire,
      workingHours: workingHours,
      registerDate: this.pharmacy?.registerDate || new Date(),
      deliveryZone: formValue.deliveryZone ?? ( this.pharmacy?.deliveryZone || null),
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
  private generateId(): string {
    return 'pharmacy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }
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
      country: this.pharmacy.country._id,
      city: this.pharmacy.city,
      suspensionDate: this.pharmacy.suspensionDate ?
        new Date(this.pharmacy.suspensionDate).toISOString().split('T')[0] : null,
      suspensionReason: this.pharmacy.suspensionReason,
      comentaire: this.pharmacy.commentaire
    });
    this.showLocationFields = !!(this.pharmacy.location?.latitude && this.pharmacy.location?.longitude);
  }
  private isValidFileType(file: File, fileType: string): boolean {
    const allowedTypes = {
      logo: ['image/jpeg', 'image/jpg', 'image/png'],
      license: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'pdf', 'doc', 'docx'],
      idDocument: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'pdf', 'doc', 'docx'],
      insurance: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'pdf', 'doc', 'docx']
    };
    return allowedTypes[fileType as keyof typeof allowedTypes]?.includes(file.type) || false;
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

  private async uploadFiles(type: number = 0): Promise<{[key: string]: string}> {
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
        formData.append('type_', fileType);
        formData.append('pharmacyId', this.pharmacy?.id || '');
        formData.append('uid', uid || '');

        try {
          const response: any = await this.apiService.post('pharmacy-managment/pharmacies/upload-document', formData, headers).toPromise();
          if (response && response.success) {
            uploadedFiles[fileType] = response.data.fileId;
          }
        } catch (error) {
          throw new Error(`Erreur lors de l'upload du fichier ${fileType}`);
        }
      }
    }
    if (type) {
      await this.loadPharmacyDetails(this.pharmacy.id);
      this.closeModal();
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
            const errorM = response?.message ?? (response?.errorMessage ?? 'Erreur lors de la sauvegarde des données');
            if (!response || typeof response.error === 'undefined' || response.error){
              reject( new Error(errorM) );
              reject(errorM);
            }else{
              if (response.error){
                reject( new Error(errorM) );
              }else{
                this.showSuccess(response.message ?? "Modification effectuee avec succes!");
                this.loadPharmacyDetails(pharmacy.id);
                resolve();
              }
            }
          },
          error: (error) => {
            reject(error);
          }
        });
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
        }
      });
  }
  async loadOpeningHours(pharmacyId: string): Promise<void> {
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

    this.apiService.post('pharmacy-managment/pharmacies/workingsHours', { id: pharmacyId, uid }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.theDayHours = response?.data || [];
        },
        error: (error) => {
          this.recentOrders = [];
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
          this.usersInfo = response?.usersMap || [];
        },
        error: (error) => {
          this.pharmacyActivities = [];
        }
      });
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
          next: async (response: any) => {
            if (response && response.data) {
              this.pharmacy = CommonFunctions.mapToPharmacy(response.data);
              await this.loadOpeningHours(pharmacyId);
              if (!["pending"].includes(this.pharmacy.status)) {
                await this.loadPharmacyActivities(pharmacyId);
                // this.loadPharmacyActivities(pharmacyId);
                setTimeout(() => {
                  this.initRevenueChart();
                  this.initMap();
                }, 500);
              }
              this.loadPharmacyDataIntoForm();
              if (this.pharmacy.status === "pending") { this.openFormInfo(); }
            } else {
              this.router.navigate(['/pharmacy/pharmacies']);
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

  onCitySelected(city: string, type: number = 0) {
    const targetForm = type === 0 ? this.pharmacyForm : this.pharmaciesCustomSave;
    targetForm.patchValue({city: city});
  }
  onCountrySelected(countryCode: string, type: number = 0): void {
    const selectedCountry = this.countriesListArray?.[countryCode];

    if (!selectedCountry) {
      this.handleError("Le pays n'a pas été retrouvé");
      return;
    }

    const targetForm = type === 0 ? this.pharmacyForm : this.pharmaciesCustomSave;
    const currentCountry = targetForm.get('country')?.value;

    if (currentCountry !== selectedCountry._id) {
      targetForm.patchValue({city: ''});
      targetForm.patchValue({country: selectedCountry._id});
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
  getFilePreviewUrl(): string {
    return this.pharmaciesCustomSave.get('url')?.value || '';
  }
  getAcceptedFileTypes(): string {
    const nameFile = this.pharmaciesCustomSave.get('nameFile')?.value;
    return nameFile === 'logo' ? 'image/*' : '.pdf,.doc,.docx,image/*';
  }
  getFileIcon(fileType: string): string {
    const file = this.selectedFiles[fileType as keyof typeof this.selectedFiles];
    if (!file) return 'fa fa-file';
    if (file.type === 'application/pdf') return 'faa fa-file-pdf';
    if (file.type.startsWith('image/')) return 'fa fa-file-image';
    return 'fa fa-file';
  }
  getDayName(index: number): string {
    this.getDayHours(index+1);
    return this.dayNames[index] || '';
  }
  getDayHours(dayNumber: number): void {
    if (!this.pharmacy?.workingHours) this.theDay = null;
    this.theDay = this.pharmacy.workingHours.find(day => day.day === dayNumber) || null;
  }
  get workingHoursFormArray(): FormArray {
    return this.pharmacyForm.get('workingHours') as FormArray;
  }

  closeModal(): void {
    this.theDayHoursPrevSubmit = this.theDayHours;
    this.modalService.dismissAll('ok');
  }
  showEditOrViewDocument(nameFile: string, edit:boolean, url: string | null, type: string = 'img', label? : string ): void  {
    this.closeModal();
    if (!this.pharmacy) { return; }
    const form = this.fb.group({
      id: [this.pharmacy.id ?? ''],
      [nameFile]: [null, [Validators.required]],
      nameFile: [nameFile ?? ''],
      label: [label ?? ''],
      url: [(type != 'img' && typeof url === 'string' ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : url) ?? ''],
      type: [type ?? 'img'],
      edit: [edit],
    });
    this.pharmaciesCustomSave = form;
    setTimeout(() => {
      this.modalService.open(this.editOrViewDocument, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }
  showEditModalCoordoneeZone(): void  {
    this.closeModal();
    if (!this.pharmacy) { return; }
    const form = this.fb.group({
      id: [this.pharmacy.id ?? ''],
      deliveryZone: [this.pharmacy.deliveryZone ?? null],
    });
    this.pharmaciesCustomSave = form;
    setTimeout(() => {
      this.modalService.open(this.formCoordonatesZoneInfos, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }
  showEditModalCoordonee(): void  {
    this.closeModal();
    if (!this.pharmacy) { return; }
    const form = this.fb.group({
      id: [this.pharmacy.id ?? ''],
      latitude: [this.pharmacy.location?.latitude ?? null],
      longitude: [this.pharmacy.location?.longitude ?? null],
    });
    if (navigator.geolocation && !this.pharmacy.location?.latitude && !this.pharmacy.location?.longitude) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.patchValue({ latitude, longitude });
        },
        (error) => {
        },
        {
          enableHighAccuracy: true,
          timeout: 5000
        }
      );
    }
    this.pharmaciesCustomSave = form;
    setTimeout(() => {
      this.modalService.open(this.formCoordonatesInfos, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }
  showEditModalInfoGeneral(): void  {
    this.closeModal();
    if (!this.pharmacy) { return; }
    const form = this.fb.group({
      id: [this.pharmacy.id ?? ''],
      name: [this.pharmacy.name ?? '', [Validators.required]],
      address: [this.pharmacy.address ?? '', [Validators.required]],
      phoneNumber: [this.pharmacy.phoneNumber ?? '', [Validators.required]],
      email: [this.pharmacy.email ?? '', [Validators.required, Validators.email]],
      country: [this.pharmacy.country?._id, Validators.required],
      city: [this.pharmacy.city, Validators.required],
    });
    this.pharmaciesCustomSave = form;
    setTimeout(() => {
      this.modalService.open(this.formGeneralInfos, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
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
  opemformLegalsInfos(): void {
    this.closeModal();
    if (!this.pharmacy) { return; }
    const form = this.fb.group({
      id: [this.pharmacy.id ?? ''],
      licenseNumber: [this.pharmacy.licenseNumber ?? '', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      siret: [this.pharmacy.siret ?? '', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      // workingHours: this.fb.array([]),
    });
    this.pharmaciesCustomSave = form;
    setTimeout(() => {
      this.modalService.open(this.formLegalsInfos, {
        size: 'xl',
        backdrop: 'static',
        // keyboard: false,
        centered: true
      });
    }, 0);
  }
  openSetHoraire(): void {
    this.closeModal();
    if (!this.pharmacy) { return; }
    this.loadingService.setLoading(true);
    const form = this.fb.group({
      id: [this.pharmacy.id ?? ''],
    });
    this.pharmaciesCustomSave = form;
    setTimeout(() => {
      this.modalService.open(this.formHorrairesInfos, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
    this.loadingService.setLoading(false);
  }
  onFileSelected(event: any, fileType: string, type: number =0): void {
    const file = event.target.files[0];
    if (file) {
      if (!this.isValidFileType(file, fileType)) {
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

      this.pharmacyForm.patchValue({
        [`${fileType}File`]: file
      });
    }
    this.uploadFiles(type);
  }
  removeFile(type:number, fileType: string): void {
    delete this.selectedFiles[fileType as keyof typeof this.selectedFiles];
    delete this.previewUrls[fileType as keyof typeof this.previewUrls];
    this.pharmacyForm.patchValue({
      [`${fileType}File`]: null
    });

    const fileInput = document.getElementById(`${fileType}File`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  onMapChange(event: { lat: number; lng: number }, type: number = 0): void {
    let targetForm = type === 0 ? this.pharmacyForm : this.pharmaciesCustomSave;
    targetForm.patchValue({
      latitude: event.lat,
      longitude: event.lng
    });
  }
  onZoneMapChange(event: ZoneCoordinates, type: number = 0): void {
    let targetForm = type === 0 ? this.pharmacyForm : this.pharmaciesCustomSave;
    let deliveryZone = targetForm.get('deliveryZone')?.value;
    if (!deliveryZone) {
      deliveryZone = new DeliveryZoneClass({
        type: 'zone',
        radius: 1,
        isActive: true,
        coordinates: event,
      });
    }else{
      deliveryZone.coordinates = event;
    }
    targetForm.patchValue( {
      deliveryZone: deliveryZone,
    });
  }
  triggerFileUpload(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }
  toggleLocationFields(): void {
    this.showLocationFields = !this.showLocationFields;
  }
  changeOpeningHour (openHour: OpeningHoursClass) {
    this.theDayHours.forEach((hour, index) => { if (hour.day == openHour.day) { hour.open = openHour.open; hour.opening = openHour.opening; hour.closing = openHour.closing;} })
  }
  downloadDocument(type: string, url: string): void {
    if (!this.pharmacy) return;
    try {
      const fileExtension = url.split('.').pop()?.toLowerCase() || 'pdf';
      const cleanPharmacyName = this.pharmacy.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${type}_${cleanPharmacyName}.${fileExtension}`;
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error('Erreur réseau');
          return response.blob();
        })
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 100);
        })
        .catch(error => {
          this.handleError('Erreur lors du téléchargement du document');
        });
    } catch (error) {
      this.handleError('Erreur lors du téléchargement du document');
    }
  }

  protected readonly HTMLInputElement = HTMLInputElement;
}
