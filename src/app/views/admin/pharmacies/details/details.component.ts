import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../theme/shared/shared.module";
import { AuthService } from "../../../../controllers/services/auth.service";
import { Pharmacy } from "../../../../models/Pharmacy";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../controllers/services/api.service';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {Chart, ChartConfiguration} from 'chart.js';

declare var bootstrap: any;
declare var google: any;

@Component({
  selector: 'app-pharmacy-detail',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, ReactiveFormsModule],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class PharmacyDetailComponent implements OnInit, OnDestroy {
  pharmacy: Pharmacy | null = null;
  recentOrders: any[] = [];
  pharmacyActivities: any[] = [];
  days: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  contactForm: FormGroup;
  currentDocument: { title: string, url: string | SafeResourceUrl, type: string } = { title: '', url: '', type: '' };

  private deleteModal: any;
  private contactModal: any;
  private documentViewerModal: any;
  private revenueChart: Chart | null = null;
  private map: any = null;

  private destroy$ = new Subject<void>();
  isLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.contactForm = this.fb.group({
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const pharmacyId = params['id'];
      if (pharmacyId) {
        this.loadPharmacyDetails(pharmacyId);
      } else {
        this.router.navigate(['/admin/pharmacies']);
      }
    });

    // Initialize Bootstrap modals
    document.addEventListener('DOMContentLoaded', () => {
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
    });

    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
        if (loaded && this.auth.getUserDetails()) {
          // Reload data if needed after auth is loaded
          if (this.pharmacy) {
            this.loadPharmacyDetails(this.pharmacy.id);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Destroy chart if it exists
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
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

      this.apiService.post('managers/pharmacies/details', { id: pharmacyId, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.pharmacy = this.mapToPharmacy(response.data);
              this.loadRecentOrders(pharmacyId);
              this.loadPharmacyActivities(pharmacyId);

              // Initialize the chart and map after data is loaded
              setTimeout(() => {
                this.initRevenueChart();
                this.initMap();
              }, 500);
            } else {
              this.router.navigate(['/admin/pharmacies']);
              this.handleError('Pharmacie non trouvée');
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des informations de la pharmacie');
            this.loadingService.setLoading(false);
            this.router.navigate(['/admin/pharmacies']);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  mapToPharmacy(data: any): Pharmacy {
    return new Pharmacy({
      id: data.id,
      name: data.name,
      address: data.address,
      status: data.status,
      ownerId: data.ownerId,
      location_latitude: data.location?.latitude || 0,
      location_longitude: data.location?.longitude || 0,
      products: data.products || [],
      workingHours: data.workingHours || {},
      orders: data.orders || [],
      totalRevenue: data.totalRevenue || 0
    });
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
    this.apiService.post('orders/recent', { id:pharmacyId, limit: 5, uid }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            this.recentOrders = response.data;
          } else {
            this.recentOrders = [];
          }
        },
        error: (error) => {
          this.recentOrders = [];
          console.error('Error loading recent orders', error);
        }
      });
  }

  async loadPharmacyActivities(pharmacyId: string): Promise<void> {
    // Load pharmacy activities/history
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
    this.apiService.post('managers/pharmacies/activities', { id:pharmacyId,uid }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            this.pharmacyActivities = response.data;
          } else {
            this.pharmacyActivities = [];
          }
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

  // Initialize the revenue chart
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

  // Initialize Google Maps
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

  // Change pharmacy status (active/suspended)
  async changeStatus(status: 'active' | 'pending' | 'suspended' | 'inactive' | 'rejected' | 'deleted'): Promise<void> {
    if (!this.pharmacy) return;

    const actionText = status === 'active' ? 'activer' : 'suspendre';
    if (status !== 'active' && status !== 'suspended') {
      return;
    }
    const confirmed = await this.showConfirmation(
      `${status === 'active' ? 'Activation' : 'Suspension'} de la pharmacie`,
      `Êtes-vous sûr de vouloir ${actionText} la pharmacie "${this.pharmacy.name}" ?`,
      status === 'active' ? 'Activer' : 'Suspendre'
    );

    if (!confirmed) return;

    const endpoint = status === 'active' ? 'managers/pharmacies/activate' : 'managers/pharmacies/suspend';

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


    this.apiService.post(endpoint, { id: this.pharmacy.id, uid }, await this.getAuthHeaders())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (this.pharmacy) {
            this.pharmacy.status = status;
            if (status === 'suspended') {
              this.pharmacy.suspensionDate = new Date();
            } else {
              this.pharmacy.suspensionDate = null;
              this.pharmacy.suspensionReason = null;
            }
          }
          this.showSuccess(`Pharmacie ${status === 'active' ? 'activée' : 'suspendue'} avec succès`);
        },
        error: (error) => {
          this.handleError(`Erreur lors de l'${actionText} de la pharmacie`);
        }
      });
  }

  // Open delete confirmation modal
  openDeleteConfirmation(): void {
    if (this.deleteModal) {
      this.deleteModal.show();
    }
  }

  // Delete pharmacy
  async deletePharmacy(): Promise<void> {
    if (!this.pharmacy) return;

    const uid = await this.auth.getUid();

    this.apiService.post('managers/pharmacies/delete', { id: this.pharmacy.id, uid }, await this.getAuthHeaders())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.showSuccess('Pharmacie supprimée avec succès');
          if (this.deleteModal) {
            this.deleteModal.hide();
          }
          // Redirect to pharmacy list
          this.router.navigate(['/admin/pharmacies']);
        },
        error: (error) => {
          this.handleError('Erreur lors de la suppression de la pharmacie');
        }
      });
  }

  // Open contact modal
  openContactModal(): void {
    if (this.contactModal) {
      this.contactForm.reset();
      this.contactModal.show();
    }
  }

  // Send message to pharmacy
  async sendMessage(): Promise<void> {
    if (!this.pharmacy || this.contactForm.invalid) return;

    const uid = await this.auth.getUid();
    const messageData = {
      pharmacyId: this.pharmacy.id,
      subject: this.contactForm.value.subject,
      message: this.contactForm.value.message,
      uid
    };

    this.apiService.post('managers/pharmacies/contact', messageData, await this.getAuthHeaders())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.showSuccess('Message envoyé avec succès');
          if (this.contactModal) {
            this.contactModal.hide();
          }
          this.contactForm.reset();
        },
        error: (error) => {
          this.handleError('Erreur lors de l\'envoi du message');
        }
      });
  }

  // View document
  viewDocument(documentType: string): void {
    if (!this.pharmacy) return;

    // Set document information based on type
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

    // Show document viewer modal
    if (this.documentViewerModal) {
      this.documentViewerModal.show();
    }
  }

  // Download document
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

  // Get status label for display
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

  // Get order status CSS class
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

  // Get activity icon based on type
  getActivityIcon(type: string): string {
    switch (type) {
      case 'status': return 'fas fa-toggle-on';
      case 'order': return 'fas fa-shopping-cart';
      case 'payment': return 'fas fa-credit-card';
      case 'admin': return 'fas fa-user-shield';
      default: return 'fas fa-history';
    }
  }

  // Error handling
  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  // Success message
  private showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: message,
      timer: 2000,
      showConfirmButton: false
    });
  }

  // Confirmation dialog
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
}
