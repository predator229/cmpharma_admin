// Angular Import
import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import { Chart, registerables } from 'chart.js';
import {AuthService} from "../../../../controllers/services/auth.service";
import {LoadingService} from "../../../../controllers/services/loading.service";
import {HttpHeaders} from "@angular/common/http";
import {Subject, takeUntil} from "rxjs";
import Swal from "sweetalert2";
import {ApiService} from "../../../../controllers/services/api.service";
import {RouterLink} from "@angular/router";
import {Pharmacy} from "../../../../models/Pharmacy";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {GoogleMap, MapMarker} from "@angular/google-maps";
import {MapComponent} from "../../../../generalmap.component";


@Component({
  selector: 'app-admin-dashboard-overview',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterLink, GoogleMap, MapMarker, MapComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})

export class AdminDashboardComponent implements OnInit {
  stats: any[] = [];
  recentActivities: any[] = [];
  recentPharmacies: Pharmacy[] = [];
  period: string = '1';
  periods: any[] = [
    {
      key:4,
      name:"Hier"
    },
    {
      key:3,
      name:"Semaine dernière"
    },
    {
      key:2,
      name:"Année dernière"
    },
  ];
  private modalService: NgbModal;
  days: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  selectedPharmacy: Pharmacy | null = null;

  constructor(modalService: NgbModal, private authUser: AuthService, private loadingService: LoadingService, private apiService: ApiService)  {
    Chart.register(...registerables);
    this.modalService = modalService;
  }

  userDetails = this.authUser.getUserDetails();

  selectedPeriod = 'month';
  recentOrders = [
    { id: 'ORD-3845', clientName: 'Marie Dupont', pharmacyName: 'Pharmacie Centrale', amount: 78.50, status: 'Livrée' },
    { id: 'ORD-3844', clientName: 'Jean Martin', pharmacyName: 'Pharmacie du Parc', amount: 42.20, status: 'En livraison' },
    { id: 'ORD-3843', clientName: 'Sophie Bernard', pharmacyName: 'Pharmacie Saint-Louis', amount: 127.99, status: 'En préparation' },
    { id: 'ORD-3842', clientName: 'Thomas Petit', pharmacyName: 'Pharmacie Moderne', amount: 56.30, status: 'Livrée' },
    { id: 'ORD-3841', clientName: 'Laura Moreau', pharmacyName: 'Pharmacie Centrale', amount: 89.75, status: 'Annulée' }
  ];

  @ViewChild('selectedPharmacyModal') selectedPharmacyModal: ElementRef | undefined;

  ngOnInit(): void {
    this.initCharts();
    this.loadGlobalsData();
  }
  private destroy$ = new Subject<void>();

  viewPharmacyDetails(pharmacy: Pharmacy): void {
    this.selectedPharmacy = pharmacy;

    setTimeout(() => {
      this.modalService.open(this.selectedPharmacyModal, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }
  public getStatusLabel(status: string): string {
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
  private mapToPharmacy(data: any): Pharmacy {
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
      totalRevenue: data.totalRevenue || 0,
      registerDate: data.created_at,
    });
  }
  async loadGlobalsData (){
    this.loadingService.setLoading(true);
    try {
      this.loadingService.setLoading(true);
      const token = await this.authUser.getRealToken();
      const uid = await this.authUser.getUid();
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });
      const thisPeriod = this.period;

      this.apiService.post('managers/dashboard', { uid, thisPeriod }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              if (response.data.global_infos){ this.stats = response.data.global_infos;}
              else{ this.stats = [];}
              if (response.data.recent_activities){ this.recentActivities = response.data.recent_activities;}
              else{ this.recentActivities = []; }
              if (response.data.recent_pharmacies){ this.recentPharmacies = response.data.recent_pharmacies.map((item: any) => this.mapToPharmacy(item));;}
              else{ this.recentPharmacies = []; }
            } else {
              this.stats = []; //damien
              this.recentActivities = [];
              this.recentPharmacies = [];
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des donnees');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }
  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  changePeriod(period: string): void {
    this.selectedPeriod = period;
    // Ici, vous feriez normalement un appel API pour récupérer les données de la période sélectionnée
    // puis vous mettriez à jour les graphiques
    this.updateCharts();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Livrée':
        return 'bg-success';
      case 'En livraison':
        return 'bg-info';
      case 'En préparation':
        return 'bg-primary';
      case 'Annulée':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  //['login', 'logout', 'order_created', 'order_updated', 'pharmacy_updated', 'profile_updated'];
  getActivityIcon(type: string): string {
    switch (type) {
      case 'order':
        return 'fas fa-shopping-cart';
      case 'pharmacy':
        return 'fas fa-clinic-medical';
      case 'payment':
        return 'fas fa-euro-sign';
      case 'user':
        return 'fas fa-user';
      case 'delivery':
        return 'fas fa-truck';
      default:
        return 'fas fa-info-circle';
    }
  }

  private initCharts(): void {
    // Graphique des ventes
    const salesCtx = document.getElementById('salesChart') as HTMLCanvasElement;
    new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [{
          label: 'Revenus (€)',
          data: [3500, 4200, 5100, 4800, 5700, 6300, 5900, 6500, 7100, 8200, 9000, 9500],
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + '€';
              }
            }
          }
        }
      }
    });

    // Graphique des statuts de commande
    const orderStatusCtx = document.getElementById('orderStatusChart') as HTMLCanvasElement;
    new Chart(orderStatusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Livrées', 'En livraison', 'En préparation', 'Annulées'],
        datasets: [{
          data: [65, 15, 12, 8],
          backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#F44336'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        cutout: '70%'
      }
    });

    // Graphique des pharmacies par région
    const pharmaciesRegionCtx = document.getElementById('pharmaciesRegionChart') as HTMLCanvasElement;
    new Chart(pharmaciesRegionCtx, {
      type: 'bar',
      data: {
        labels: ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Autres'],
        datasets: [{
          label: 'Nombre de pharmacies',
          data: [42, 27, 25, 18, 15, 30],
          backgroundColor: ['#FF9800', '#9C27B0', '#2196F3', '#4CAF50', '#F44336', '#607D8B'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private updateCharts(): void {
    // Cette méthode serait appelée pour mettre à jour les graphiques avec les nouvelles données
    console.log(`Mise à jour des graphiques pour la période: ${this.selectedPeriod}`);
    // Ici, vous feriez la mise à jour des graphiques avec les nouvelles données
  }

  closeModal() {
    this.modalService.dismissAll('ok');
  }
}

