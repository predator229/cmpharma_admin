import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import { Chart, registerables } from 'chart.js';
import {AuthService} from "../../../../controllers/services/auth.service";
import {LoadingService} from "../../../../controllers/services/loading.service";
import { ApiService } from "../../../../controllers/services/api.service";
import { HttpHeaders } from "@angular/common/http";
import { Subject, takeUntil } from "rxjs";
import Swal from "sweetalert2";
@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit, OnDestroy {
// Propriétés pour le filtering et le chargement
  selectedPeriod: string = '1';
  chartPeriod: string = 'month';
  isLoading: boolean = false;
// Destruction des subscriptions
  private destroy$ = new Subject<void>();
// Données des statistiques
  generalStats: any[] = [];
  regionPerformance: any[] = [];
  topProducts: any[] = [];
  performanceKPIs: any[] = [];
// Les périodes disponibles
  periods: any[] = [
    {
      key: 4,
      name: "Hier"
    },
    {
      key: 3,
      name: "Semaine dernière"
    },
    {
      key: 2,
      name: "Année dernière"
    },
  ];
// Graphiques
  salesChart: any;
  revenueDistributionChart: any;
  trendForecastChart: any;
  constructor(
    private authService: AuthService,
    private loadingService: LoadingService,
    private apiService: ApiService
  ) {
    Chart.register(...registerables);
  }
  ngOnInit(): void {
    this.loadStatisticsData();
  }
  ngOnDestroy(): void {
// Nettoyage des subscriptions pour éviter les fuites mémoire
    this.destroy$.next();
    this.destroy$.complete();
// Destruction des graphiques pour éviter les fuites mémoire
    if (this.salesChart) {
      this.salesChart.destroy();
    }
    if (this.revenueDistributionChart) {
      this.revenueDistributionChart.destroy();
    }
    if (this.trendForecastChart) {
      this.trendForecastChart.destroy();
    }
  }
  async loadStatisticsData(): Promise<void> {
    this.isLoading = true;
    this.loadingService.setLoading(true);
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();

      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      // Récupération des statistiques générales
      this.apiService.post('managers/statistics/general', {
        uid,
        period: this.selectedPeriod
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.generalStats = response.data;
            } else {
              this.generalStats = this.getMockGeneralStats();
            }

            // Continuer avec les autres appels API
            this.loadRegionPerformance(uid, headers);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des statistiques générales');
            this.isLoading = false;
            this.loadingService.setLoading(false);

            // Chargement des données mock en cas d'erreur
            this.loadMockData();
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isLoading = false;
      this.loadingService.setLoading(false);

      // Chargement des données mock en cas d'erreur
      this.loadMockData();
    }
  }
  private loadRegionPerformance(uid: string, headers: HttpHeaders): void {
    this.apiService.post('managers/statistics/regions', {
      uid,
      period: this.selectedPeriod
    }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            this.regionPerformance = response.data;
          } else {
            this.regionPerformance = this.getMockRegionPerformance();
          }
          // Continuer avec les autres appels API
          this.loadTopProducts(uid, headers);
        },
        error: (error) => {
          this.handleError('Erreur lors du chargement des performances par région');
          this.regionPerformance = this.getMockRegionPerformance();
          this.loadTopProducts(uid, headers);
        }
      });
  }
  private loadTopProducts(uid: string, headers: HttpHeaders): void {
    this.apiService.post('managers/statistics/products', {
      uid,
      period: this.selectedPeriod
    }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            this.topProducts = response.data;
          } else {
            this.topProducts = this.getMockTopProducts();
          }
          // Continuer avec les autres appels API
          this.loadPerformanceKPIs(uid, headers);
        },
        error: (error) => {
          this.handleError('Erreur lors du chargement des produits les plus vendus');
          this.topProducts = this.getMockTopProducts();
          this.loadPerformanceKPIs(uid, headers);
        }
      });
  }
  private loadPerformanceKPIs(uid: string, headers: HttpHeaders): void {
    this.apiService.post('managers/statistics/kpis', {
      uid,
      period: this.selectedPeriod
    }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            this.performanceKPIs = response.data;
          } else {
            this.performanceKPIs = this.getMockPerformanceKPIs();
          }
          // Finaliser le chargement et initialiser les graphiques
          this.isLoading = false;
          this.loadingService.setLoading(false);

          // Initialiser les graphiques une fois toutes les données chargées
          setTimeout(() => {
            this.initCharts();
          }, 100);
        },
        error: (error) => {
          this.handleError('Erreur lors du chargement des KPIs');
          this.performanceKPIs = this.getMockPerformanceKPIs();

          this.isLoading = false;
          this.loadingService.setLoading(false);

          // Initialiser les graphiques même en cas d'erreur
          setTimeout(() => {
            this.initCharts();
          }, 100);
        }
      });
  }
  private loadMockData(): void {
    this.generalStats = this.getMockGeneralStats();
    this.regionPerformance = this.getMockRegionPerformance();
    this.topProducts = this.getMockTopProducts();
    this.performanceKPIs = this.getMockPerformanceKPIs();
// Initialiser les graphiques avec les données mock
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }
  changeChartPeriod(period: string): void {
    this.chartPeriod = period;
// Mettre à jour les graphiques en fonction de la période sélectionnée
    this.updateCharts();
  }
  private initCharts(): void {
// Graphique des ventes
    const salesCtx = document.getElementById('salesStatsChart') as HTMLCanvasElement;
    if (salesCtx) {
      this.salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
          datasets: [{
            label: 'Chiffre d\'affaires (€)',
            data: [15000, 17500, 21000, 19500, 22500, 25000, 23000, 27000, 29500, 31000, 33500, 36000],
            borderColor: '#1565c0',
            backgroundColor: 'rgba(21, 101, 192, 0.1)',
            tension: 0.4,
            fill: true
          }, {
            label: 'Nombre de commandes',
            data: [120, 150, 180, 165, 190, 210, 195, 230, 250, 265, 285, 305],
            borderColor: '#4527a0',
            backgroundColor: 'rgba(69, 39, 160, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Chiffre d\'affaires (€)'
              },
              ticks: {
                callback: function(value) {
                  return value + '€';
                }
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              title: {
                display: true,
                text: 'Nombre de commandes'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      });
    }
// Graphique de répartition des revenus
    const revenueDistributionCtx = document.getElementById('revenueDistributionChart') as HTMLCanvasElement;
    if (revenueDistributionCtx) {
      this.revenueDistributionChart = new Chart(revenueDistributionCtx, {
        type: 'doughnut',
        data: {
          labels: ['Médicaments', 'Parapharmacie', 'Compléments alimentaires', 'Équipements', 'Autres'],
          datasets: [{
            data: [45, 25, 15, 10, 5],
            backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#607d8b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 15
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': ' + context.parsed + '%';
                }
              }
            }
          },
          cutout: '70%'
        }
      });
    }

// Graphique des tendances et prévisions
    const trendForecastCtx = document.getElementById('trendForecastChart') as HTMLCanvasElement;
    if (trendForecastCtx) {
      this.trendForecastChart = new Chart(trendForecastCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
          datasets: [{
            label: 'Réel',
            data: [15000, 17500, 21000, 19500, 22500, 25000, null, null, null, null, null, null],
            borderColor: '#1565c0',
            backgroundColor: 'rgba(21, 101, 192, 0.1)',
            tension: 0.4,
            fill: true
          }, {
            label: 'Prévision',
            data: [null, null, null, null, null, 25000, 27000, 29000, 32000, 34000, 37000, 40000],
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderDash: [5, 5],
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false
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
    }
  }
  private updateCharts(): void {
    if (!this.salesChart) return;
    let labels: string[] = [];
    let salesData: number[] = [];
    let ordersData: number[] = [];

// Mise à jour des données en fonction de la période
    switch (this.chartPeriod) {
      case 'day':
        labels = ['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
        salesData = [100, 150, 80, 50, 200, 450, 600, 800, 900, 1200, 950, 500];
        ordersData = [1, 2, 1, 0, 3, 5, 8, 10, 12, 15, 11, 6];
        break;
      case 'week':
        labels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        salesData = [3500, 4200, 3900, 4500, 5200, 6800, 2900];
        ordersData = [28, 35, 32, 38, 45, 58, 25];
        break;
      case 'month':
      default:
        labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        salesData = [15000, 17500, 21000, 19500, 22500, 25000, 23000, 27000, 29500, 31000, 33500, 36000];
        ordersData = [120, 150, 180, 165, 190, 210, 195, 230, 250, 265, 285, 305];
        break;
    }

// Mise à jour du graphique des ventes
    this.salesChart.data.labels = labels;
    this.salesChart.data.datasets[0].data = salesData;
    this.salesChart.data.datasets[1].data = ordersData;
    this.salesChart.update();
  }
  exportData(format: string): void {
    this.isLoading = true;
// Simulation d'une exportation
    setTimeout(() => {
      this.isLoading = false;
      Swal.fire({
        icon: 'success',
        title: 'Exportation réussie',
        text: `Les données ont été exportées au format ${format.toUpperCase()} avec succès.`,
        timer: 2000,
        showConfirmButton: false
      });
    }, 1500);
  }
  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }
// Méthodes pour générer des données mock
  private getMockGeneralStats(): any[] {
    return [
      {
        name: 'Pharmacies',
        total: '157',
        peperiod: '3 nouvelles',
        difference: '4.2',
        type: 1,
        icon: 'fas fa-clinic-medical',
        divicon: 'pharmacy-icon'
      },
      {
        name: 'Commandes',
        total: '2,483',
        peperiod: '342 commandes',
        difference: '5.8',
        type: 1,
        icon: 'fas fa-shopping-cart',
        divicon: 'order-icon'
      },
      {
        name: 'Chiffre d\'affaires',
        total: '98,540€',
        peperiod: '+12,350€',
        difference: '14.3',
        type: 1,
        icon: 'fas fa-euro-sign',
        divicon: 'revenue-icon'
      },
      {
        name: 'Clients actifs',
        total: '3,247',
        peperiod: '+256 clients',
        difference: '8.5',
        type: 1,
        icon: 'fas fa-users',
        divicon: 'user-icon'
      }
    ];
  }
  private getMockRegionPerformance(): any[] {
    return [
      { name: 'Paris', pharmacies: 42, orders: 843, revenue: 32580, growthRate: 8.5 },
      { name: 'Lyon', pharmacies: 27, orders: 624, revenue: 24750, growthRate: 6.2 },
      { name: 'Marseille', pharmacies: 25, orders: 512, revenue: 19820, growthRate: 4.8 },
      { name: 'Bordeaux', pharmacies: 18, orders: 320, revenue: 12400, growthRate: 9.3 },
      { name: 'Lille', pharmacies: 15, orders: 184, revenue: 8990, growthRate: -2.1 }
    ];
  }
  private getMockTopProducts(): any[] {
    return [
      { name: 'Doliprane 1000mg', category: 'Médicaments', quantity: 1245, revenue: 4980 },
      { name: 'Crème hydratante XYZ', category: 'Parapharmacie', quantity: 876, revenue: 21900 },
      { name: 'Vitamine D3', category: 'Compléments alimentaires', quantity: 743, revenue: 14860 },
      { name: 'Aspirine 500mg', category: 'Médicaments', quantity: 623, revenue: 1869 },
      { name: 'Tensiomètre ABC', category: 'Équipements', quantity: 127, revenue: 6350 }
    ];
  }
  private getMockPerformanceKPIs(): any[] {
    return [
      { name: 'Panier moyen', value: '39.68', unit: '€', change: 5.2, icon: 'fas fa-shopping-basket' },
      { name: 'Taux de conversion', value: '4.2', unit: '%', change: 0.8, icon: 'fas fa-exchange-alt' },
      { name: 'Délai de livraison moyen', value: '1.8', unit: ' jours', change: -12.5, icon: 'fas fa-truck' }
    ];
  }
}
