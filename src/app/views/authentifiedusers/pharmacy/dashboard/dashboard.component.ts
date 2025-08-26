import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, interval, forkJoin } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

// Imports de services
import { AuthService } from '../../../../controllers/services/auth.service';
import { ApiService } from '../../../../controllers/services/api.service';
import { LoadingService } from '../../../../controllers/services/loading.service';
import { MiniChatService } from '../../../../controllers/services/minichat.service';

// Imports de modèles
import { UserDetails } from '../../../../models/UserDatails';
import { OrderClass } from '../../../../models/Order.class';
import { ActivityLoged } from '../../../../models/Activity.class';
import { PharmacyClass } from '../../../../models/Pharmacy.class';
import { Ticket } from '../../../../models/Ticket.class';

// Imports de composants
import { SharedModule } from '../../../theme/shared/shared.module';
import {
  ActivityTimelineComponent,
  UsersMap,
} from "../../sharedComponents/activity-timeline/activity-timeline.component";
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';

Chart.register(...registerables);

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    todayOrders: number;
    revenue: number;
    averageOrderValue: number;
    growthRate: number;
  };
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    urgent: number;
    responseTime: number;
  };
  activities: {
    total: number;
    todayActivities: number;
    mostActiveUsers: Array<{userId: string, name: string, count: number}>;
  };
  pharmacies: {
    total: number;
    active: number;
    inactive: number;
    topPerforming: Array<{id: string, name: string, revenue: number}>;
  };
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    onlineNow: number;
  };
}

// interface ChartData {
//   labels: string[];
//   datasets: Array<{
//     label: string;
//     data: number[];
//     backgroundColor?: string | string[];
//     borderColor?: string;
//     borderWidth?: number;
//     fill?: boolean;
//   }>;
// }

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  route: string;
  color: string;
  permission?: string;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'ticket' | 'user' | 'pharmacy';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  status?: string;
  priority?: string;
}

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule, ActivityTimelineComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class PharmacyDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('ordersChart') ordersChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ticketsChart') ticketsChart!: ElementRef<HTMLCanvasElement>;

  // Données du dashboard
  stats: DashboardStats = {
    orders: {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      todayOrders: 0,
      revenue: 0,
      averageOrderValue: 0,
      growthRate: 0
    },
    tickets: {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      urgent: 0,
      responseTime: 0
    },
    activities: {
      total: 0,
      todayActivities: 0,
      mostActiveUsers: []
    },
    pharmacies: {
      total: 0,
      active: 0,
      inactive: 0,
      topPerforming: []
    },
    users: {
      total: 0,
      active: 0,
      newThisMonth: 0,
      onlineNow: 0
    }
  };

  // Données pour les graphiques
  ordersChartData: ChartData = { labels: [], datasets: [] };
  revenueChartData: ChartData = { labels: [], datasets: [] };
  ticketsChartData: ChartData = { labels: [], datasets: [] };

  // Activités récentes
  recentActivities: ActivityLoged[] = [];
  recentOrders: OrderClass[] = [];
  recentTickets: Ticket[] = [];
  usersInfo: UsersMap = {};

  // Actions rapides
  quickActions: QuickAction[] = [
    {
      icon: 'fas fa-shopping-cart',
      title: 'Commandes',
      description: 'Toutes les commande',
      route: '/pharmacy/orders/list',
      color: 'primary'
    },
    {
      icon: 'fas fa-ticket-alt',
      title: 'Tickets',
      description: 'Ouvrir la liste des tickets de support',
      route: '/pharmacy/support/list',
      color: 'warning'
    },
    {
      icon: 'fas fa-users',
      title: 'Gestion Utilisateurs',
      description: 'Gérer les utilisateurs',
      route: '/pharmacy/users/list',
      color: 'info'
    },
    // {
    //   icon: 'fas fa-chart-line',
    //   title: 'Rapports',
    //   description: 'Voir les rapports détaillés',
    //   route: '/pharmacy/reports',
    //   color: 'success'
    // },
    // {
    //   icon: 'fas fa-cog',
    //   title: 'Paramètres',
    //   description: 'Configuration du système',
    //   route: '/pharmacy/settings',
    //   color: 'secondary'
    // },
    {
      icon: 'fas fa-hospital',
      title: 'Pharmacies',
      description: 'Gérer les pharmacies',
      route: '/pharmacy/pharmacies/list',
      color: 'danger'
    }
  ];

  // Filtres et vues
  filterForm: FormGroup;
  selectedTimeRange = '7d';
  selectedView = 'overview';
  availableViews = [
    { value: 'overview', label: 'Vue d\'ensemble', icon: 'fas fa-tachometer-alt' },
    { value: 'orders', label: 'Commandes', icon: 'fas fa-shopping-cart' },
    { value: 'tickets', label: 'Support', icon: 'fas fa-ticket-alt' },
    { value: 'analytics', label: 'Analytiques', icon: 'fas fa-chart-bar' }
  ];

  // États
  isLoading = false;
  isConnected = false;
  errorMessage = '';
  userDetail: UserDetails;
  lastUpdated = new Date();

  private destroy$ = new Subject<void>();
  private refreshTimer$ = interval(300000); // Refresh toutes les 5 minutes
  private namespace = 'internal_messaging';

  @ViewChild('monthlyStatsChart', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  orders30days: OrderClass[] = [];
  orders30daysTotal: number = 0;
  revenue30daysTotal: number = 0;
  revenue30days = [];

  private chart?: Chart;
  monthlyStats: any[] = [];
  countOrders: number = 0;
  tabCahrt: string = 'monthlyStatsChart';

  constructor(
    private auth: AuthService,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private chatService: MiniChatService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      timeRange: [this.selectedTimeRange],
      pharmacy: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        if (loaded) {
          this.userDetail = this.auth.getUserDetails();
          await this.initializeDashboard();
          this.setupRealtimeUpdates();
        }
      });

    // Auto-refresh des données
    this.refreshTimer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshDashboard();
      });

    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  ngAfterViewInit() {
    if (this.monthlyStats.length > 0) {
      this.initMonthlyStatsChart();
    }
  }
  private async initializeDashboard(): Promise<void> {
    this.isLoading = true;
    try {
      await this.connectToRealtime();
      await this.loadAllDashboardData();
      this.setupCharts();
    } catch (error) {
      console.error('❌ Erreur initialisation dashboard:', error);
      this.errorMessage = 'Erreur lors du chargement du dashboard';
    } finally {
      this.isLoading = false;
    }
  }

  private async connectToRealtime(): Promise<void> {
    try {
      const token = await this.auth.getRealToken();
      if (!token) return;

      this.chatService.connectToNamespace(this.namespace, token, this.userDetail.id);

      // Écouter les nouvelles commandes
      this.chatService.getOrders()
        .pipe(takeUntil(this.destroy$))
        .subscribe((order: OrderClass) => {
          this.handleNewOrder(order);
        });

      // Écouter les nouvelles activités
      this.chatService.getActivities()
        .pipe(takeUntil(this.destroy$))
        .subscribe((activity: ActivityLoged) => {
          this.handleNewActivity(activity);
        });

      // Vérifier le statut de connexion
      this.chatService.getConnectionStatusForNamespace(this.namespace)
        .pipe(takeUntil(this.destroy$))
        .subscribe(isConnected => {
          this.isConnected = isConnected;
        });

    } catch (error) {
      console.error('❌ Erreur connexion temps réel:', error);
    }
  }

  private async loadAllDashboardData(): Promise<void> {
    const token = await this.auth.getRealToken();
    const uid = await this.auth.getUid();

    if (!token || !uid) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    const timeRange = this.getTimeRangeFilter();

    try {
      // Charger toutes les données en parallèle
      const requests = [
        this.loadOrdersStats(headers, uid, timeRange),
        this.loadTicketsStats(headers, uid, timeRange),
        this.loadActivitiesStats(headers, uid, timeRange),
        this.loadPharmaciesStats(headers, uid),
        this.loadUsersStats(headers, uid),
        this.loadRecentActivities(headers, uid),
        this.loadChartData(headers, uid, timeRange)
      ];

      await Promise.all(requests);
      this.lastUpdated = new Date();

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      throw error;
    }
  }

  private async loadOrdersStats(headers: HttpHeaders, uid: string, timeRange: any): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'pharmacy-management/dashboard/orders-stats',
        { uid, ...timeRange },
        headers
      ).toPromise();

      if (response && !response.error) {
        this.stats.orders = {
          total: response.data.total || 0,
          pending: response.data.pending || 0,
          completed: response.data.completed || 0,
          cancelled: response.data.cancelled || 0,
          todayOrders: response.data.todayOrders || 0,
          revenue: response.data.revenue || 0,
          averageOrderValue: response.data.averageOrderValue || 0,
          growthRate: response.data.growthRate || 0
        };
        // Nouvelles données pour le graphique
        this.monthlyStats = response.monthlyStats || [];
        this.countOrders = response.countOrders ?? 0;
        setTimeout(() => {
          this.initMonthlyStatsChart(); // Nouveau graphique
        }, 500);

      }
    } catch (error) {
      console.error('Erreur chargement stats commandes:', error);
    }
  }

  private async loadTicketsStats(headers: HttpHeaders, uid: string, timeRange: any): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'pharmacy-management/dashboard/tickets-stats',
        { uid, ...timeRange },
        headers
      ).toPromise();

      if (response && !response.error) {
        this.stats.tickets = {
          total: response.data.total || 0,
          open: response.data.open || 0,
          inProgress: response.data.inProgress || 0,
          resolved: response.data.resolved || 0,
          urgent: response.data.urgent || 0,
          responseTime: response.data.averageResponseTime || 0
        };
      }
    } catch (error) {
      console.error('Erreur chargement stats tickets:', error);
    }
  }

  private async loadActivitiesStats(headers: HttpHeaders, uid: string, timeRange: any): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'tools/activitiesStats',
        { uid, ...timeRange },
        headers
      ).toPromise();

      if (response && !response.error) {
        this.stats.activities = {
          total: response.data.total || 0,
          todayActivities: response.data.todayActivities || 0,
          mostActiveUsers: response.data.mostActiveUsers || []
        };

        this.recentActivities = (response.data.recentActivities || [])
          .map((activity: any) => new ActivityLoged(activity))
          .slice(0, 10);

        this.usersInfo = response.usersMap || {};
      }
    } catch (error) {
      console.error('Erreur chargement stats activités:', error);
    }
  }

  private async loadPharmaciesStats(headers: HttpHeaders, uid: string): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'pharmacy-managment/pharmacies/stats',
        { uid },
        headers
      ).toPromise();

      if (response && !response.error) {
        this.stats.pharmacies = {
          total: response.data.total || 0,
          active: response.data.active || 0,
          inactive: response.data.inactive || 0,
          topPerforming: response.data.topPerforming || []
        };
      }
    } catch (error) {
      console.error('Erreur chargement stats pharmacies:', error);
    }
  }

  private async loadUsersStats(headers: HttpHeaders, uid: string): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'pharmacy-management/users/stats',
        { uid },
        headers
      ).toPromise();

      if (response && !response.error) {
        this.stats.users = {
          total: response.data.total || 0,
          active: response.data.active || 0,
          newThisMonth: response.data.newThisMonth || 0,
          onlineNow: response.data.onlineNow || 0
        };
      }
    } catch (error) {
      console.error('Erreur chargement stats utilisateurs:', error);
    }
  }

  private async loadRecentActivities(headers: HttpHeaders, uid: string): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'tools/activitiesAll',
        {
          uid,
          limit: 15,
          dateRange: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        },
        headers
      ).toPromise();

      if (response && !response.error && response.data) {
        this.recentActivities = response.data
          .map((activity: any) => new ActivityLoged(activity))
          .slice(0, 10);
      }
    } catch (error) {
      console.error('Erreur chargement activités récentes:', error);
    }
  }

  private async loadChartData(headers: HttpHeaders, uid: string, timeRange: any): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'pharmacy-management/dashboard/charts-data',
        { uid, ...timeRange },
        headers
      ).toPromise();

      if (response && !response.error) {
        this.ordersChartData = response.data.ordersChart || { labels: [], datasets: [] };
        this.revenueChartData = response.data.revenueChart || { labels: [], datasets: [] };
        this.ticketsChartData = response.data.ticketsChart || { labels: [], datasets: [] };
      }
    } catch (error) {
      console.error('Erreur chargement données graphiques:', error);
    }
  }

  private setupFormSubscriptions(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(values => {
        this.selectedTimeRange = values.timeRange;
        this.refreshDashboard();
      });
  }

  private setupRealtimeUpdates(): void {
    // Setup sera fait quand les observables sont disponibles
  }

  private setupCharts(): void {
    // Configuration des graphiques sera faite après le chargement de la vue
    setTimeout(() => {
      this.renderOrdersChart();
      this.renderRevenueChart();
      this.renderTicketsChart();
    }, 100);
  }

  private renderOrdersChart(): void {
    if (!this.ordersChart?.nativeElement) return;

    const ctx = this.ordersChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Implémentation du graphique des commandes
    // Utilisation de Chart.js ou une autre librairie
  }

  private renderRevenueChart(): void {
    if (!this.revenueChart?.nativeElement) return;

    const ctx = this.revenueChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Implémentation du graphique des revenus
  }

  private renderTicketsChart(): void {
    if (!this.ticketsChart?.nativeElement) return;

    const ctx = this.ticketsChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Implémentation du graphique des tickets
  }

  private handleNewOrder(order: OrderClass): void {
    // Mettre à jour les stats en temps réel
    this.stats.orders.total++;
    this.stats.orders.todayOrders++;
    this.stats.orders.revenue += order.totalAmount;

    // Ajouter aux commandes récentes
    this.recentOrders.unshift(order);
    if (this.recentOrders.length > 5) {
      this.recentOrders.pop();
    }

    this.lastUpdated = new Date();
  }

  private handleNewActivity(activity: ActivityLoged): void {
    if (activity.namespace === this.namespace) {
      this.stats.activities.total++;
      this.stats.activities.todayActivities++;

      // Ajouter aux activités récentes
      this.recentActivities.unshift(activity);
      if (this.recentActivities.length > 10) {
        this.recentActivities.pop();
      }

      this.lastUpdated = new Date();
    }
  }

  private getTimeRangeFilter(): any {
    const now = new Date();
    let startDate: Date;

    switch (this.selectedTimeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };
  }

  // Méthodes publiques pour les actions
  navigateToQuickAction(action: QuickAction): void {
    this.router.navigate([action.route]);
  }

  changeTimeRange(range: string): void {
    this.selectedTimeRange = range;
    this.filterForm.patchValue({ timeRange: range });
  }

  changeView(view: string): void {
    this.selectedView = view;
    setTimeout(() => {
      this.initMonthlyStatsChart(); // Nouveau graphique
    }, 500);
  }

  async refreshDashboard(): Promise<void> {
    this.isLoading = true;
    try {
      await this.loadAllDashboardData();
      this.setupCharts();
    } catch (error) {
      console.error('❌ Erreur refresh dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  exportDashboard(): void {
    // Implémentation de l'export des données du dashboard
    console.log('Export dashboard data');
  }

  // Méthodes utilitaires
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num);
  }

  formatPercentage(num: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(num / 100);
  }

  getGrowthClass(rate: number): string {
    if (rate > 0) return 'text-success';
    if (rate < 0) return 'text-danger';
    return 'text-muted';
  }

  getGrowthIcon(rate: number): string {
    if (rate > 0) return 'fas fa-arrow-up';
    if (rate < 0) return 'fas fa-arrow-down';
    return 'fas fa-minus';
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'completed': 'badge-success',
      'pending': 'badge-warning',
      'cancelled': 'badge-danger',
      'open': 'badge-info',
      'in_progress': 'badge-primary',
      'resolved': 'badge-success'
    };
    return classes[status] || 'badge-secondary';
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'urgent': 'text-danger',
      'high': 'text-warning',
      'medium': 'text-info',
      'low': 'text-success'
    };
    return classes[priority] || 'text-muted';
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByActivityId(index: number, activity: ActivityLoged): string {
    return activity._id || index.toString();
  }

  trackByOrderId(index: number, order: OrderClass): string {
    return order._id || index.toString();
  }

  initMonthlyStatsChart() {
    if (!this.monthlyStats || this.monthlyStats.length === 0) {
      return;
    }

    // Détruire le graphique existant s'il existe
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.monthlyStats.map(stat => stat.monthShort);

    const config: ChartConfiguration = {
      type: 'bar', // Type principal
      data: {
        labels: labels,
        datasets: [
          {
            type: 'line',
            label: 'Commandes',
            data: this.monthlyStats.map(stat => stat.orders),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'Revenus (€)',
            data: this.monthlyStats.map(stat => stat.revenue),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: '#22c55e',
            borderWidth: 1,
            yAxisID: 'y1'
          },
          {
            type: 'line',
            label: 'Nouveaux clients',
            data: this.monthlyStats.map(stat => stat.newCustomers),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: 'Évolution sur 12 mois - Commandes, Revenus et Nouveaux Clients'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Mois'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Commandes / Nouveaux clients'
            },
            grid: {
              drawOnChartArea: false,
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Revenus (€)'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
  getMonthlyStatsSummary() {
    if (!this.monthlyStats || this.monthlyStats.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalNewCustomers: 0,
        averageOrdersPerMonth: 0,
        averageRevenuePerMonth: 0
      };
    }

    const totalOrders = this.monthlyStats.reduce((sum, stat) => sum + stat, 0);
    const totalRevenue = this.monthlyStats.reduce((sum, stat) => sum + stat.revenue, 0);
    const totalNewCustomers = this.monthlyStats.reduce((sum, stat) => sum + stat.newCustomers, 0);

    return {
      totalOrders,
      totalRevenue,
      totalNewCustomers,
      averageOrdersPerMonth: Math.round(totalOrders / 12),
      averageRevenuePerMonth: Math.round(totalRevenue / 12)
    };
  }
  getEvolutionPercentage(previousValue: number, currentValue: number): string {
    if (previousValue === 0) {
      return currentValue > 0 ? '+100' : '0';
    }

    const percentage = ((currentValue - previousValue) / previousValue) * 100;
    return percentage > 0 ? `+${percentage.toFixed(1)}` : percentage.toFixed(1);
  }
  getEvolutionClass(previousValue: number, currentValue: number): string {
    if (previousValue === 0) {
      return currentValue > 0 ? 'text-success' : 'text-muted';
    }

    const percentage = ((currentValue - previousValue) / previousValue) * 100;
    if (percentage > 0) return 'text-success';
    if (percentage < 0) return 'text-danger';
    return 'text-muted';
  }
  getEvolutionIcon(previousValue: number, currentValue: number): string {
    if (previousValue === 0) {
      return currentValue > 0 ? 'fas fa-arrow-up' : 'fas fa-minus';
    }

    const percentage = ((currentValue - previousValue) / previousValue) * 100;
    if (percentage > 0) return 'fas fa-arrow-up';
    if (percentage < 0) return 'fas fa-arrow-down';
    return 'fas fa-minus';
  }
  getEvolutionText(previousValue: number, currentValue: number): string {
    if (previousValue === 0) {
      return currentValue > 0 ? 'Première valeur positive' : 'Aucune évolution';
    }

    const percentage = ((currentValue - previousValue) / previousValue) * 100;
    if (percentage > 0) return `Augmentation de ${percentage.toFixed(1)}%`;
    if (percentage < 0) return `Diminution de ${Math.abs(percentage).toFixed(1)}%`;
    return 'Stable';
  }

  setTabChartActive (tabname: 'monthlyStatsChart' | 'monthlyStatsDetails'): void {
    this.tabCahrt = tabname;
  }
}
