import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, interval, forkJoin } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";

// Imports de services
import { AuthService } from '../../../../../controllers/services/auth.service';
import { ApiService } from '../../../../../controllers/services/api.service';
import { LoadingService } from '../../../../../controllers/services/loading.service';
import { MiniChatService } from '../../../../../controllers/services/minichat.service';

// Imports de modèles
import { UserDetails } from '../../../../../models/UserDatails';
import { OrderClass } from '../../../../../models/Order.class';
import { ActivityLoged } from '../../../../../models/Activity.class';
import { PharmacyClass } from '../../../../../models/Pharmacy.class';
import {Ticket, TicketStatus} from '../../../../../models/Ticket.class';

// Imports de composants
import { SharedModule } from '../../../../theme/shared/shared.module';
import {
  ActivityTimelineComponent,
  UsersMap,
} from "../../../sharedComponents/activity-timeline/activity-timeline.component";
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import {NotifyService} from "../../../../../controllers/services/notification.service";
import {Select2} from "ng-select2-component";
import {PHARMACY_RESTRICTIONS} from "../../../../../models/Category.class";
import {start} from "@popperjs/core";
import {resolve} from "@angular/compiler-cli";
import {CommonFunctions} from "../../../../../controllers/comonsfunctions";

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
    orders: OrderClass[];
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
      growthRate: 0,
      orders: []
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
    { value: 'activites', label: 'Activités', icon: 'fas fa-timeline' },
    { value: 'tickets', label: 'Support', icon: 'fas fa-ticket-alt' },
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

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  orders30days: OrderClass[] = [];
  revenue30days = [];

  private chart?: Chart;
  periodStats: any[] = [];
  countOrders: number = 0;

  filteredRecentOrders: OrderClass[] = [];
  availablePharmacies: PharmacyClass[] = [];

// Filtres pour les commandes
  ordersFilter = {
    status: '',
    pharmacy: '',
    dateFrom: '',
    dateTo: ''
  };

// Charts instances
  private ordersChartInstance?: Chart;
  private revenueChartInstance?: Chart;
  private ticketsChartInstance?: Chart;

  dateStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  dateEnd = new Date();

  selectedPeriod = 'yersterdatT0Today';
  optionsPeriodDatas = [
    { value: 'year', label: 'Dernière année' },
    { value: 'month', label: 'Dernier mois (30 derniers jours)' },
    { value: 'week', label: 'Dernière semaine' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'yersterdatT0Today', label: 'D\'hier a aujourd\'hui' },
  ];
  isPeriodDropdownOpen: boolean;
  periodType: string = 'yersterdatT0Today';

  constructor(
    private auth: AuthService,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private chatService: MiniChatService,
    private fb: FormBuilder,
    private router: Router,
    private notify: NotifyService
  ) {
    this.filterForm = this.fb.group({
      timeRange: [this.selectedTimeRange],
      pharmacy: [''],
      status: ['']
    });
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        if (loaded) {
          this.userDetail = this.auth.getUserDetails();
          this.setDateIntervalFromPeriod(this.selectedPeriod);
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

  private async initializeDashboard(): Promise<void> {
    this.isLoading = true;
    try {
      await this.connectToRealtime();
      await Promise.all([
        this.loadAllDashboardData(),
        this.loadAvailablePharmacies()
      ]);
      this.filteredRecentOrders = [...this.stats.orders?.orders ?? []];
      this.setupCharts();
    } catch (error) {
      console.error('❌ Erreur initialisation dashboard:', error);
      this.errorMessage = 'Erreur lors du chargement du dashboard';
    } finally {
      this.isLoading = false;
    }
  }

  private setupCharts(): void {
    setTimeout(() => {
      if (this.selectedView === 'overview') {
        this.initMainStatsChart();
        this.renderOrdersChart();
        this.renderRevenueChart();
        this.renderTicketsChart();
      }
    }, 500);
  }

  async setDateIntervalFromPeriod(period: string): Promise<any> {
    this.loadingService.setLoading(true);
    this.isPeriodDropdownOpen = false;
    if (!['month', 'week', 'year', 'today', 'yersterdatT0Today'].includes(period)) { period = 'today'; }
    this.selectedPeriod = period;
    switch (period) {
      case 'today':
        this.dateEnd = new Date(Date.now());
        this.dateStart = new Date();
        this.dateStart.setHours(0, 0, 0, 0);
        break;
      case 'yersterdatT0Today':
        this.dateEnd = new Date(Date.now());
        this.dateStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.dateStart.setHours(0, 0, 0, 0);
        break;
      case 'week':
        this.dateEnd = new Date();
        this.dateStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        this.dateStart.setHours(0, 0, 0, 0);
        break;
      case 'year':
        this.dateEnd = new Date();
        this.dateStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        this.dateStart.setHours(0, 0, 0, 0);
        break;
      case 'month':
        this.dateEnd = new Date();
        this.dateStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        this.dateStart.setHours(0, 0, 0, 0);
        break;
      default:
        break;
    }
    await this.initializeDashboard();
    this.setupRealtimeUpdates();
    this.loadingService.setLoading(false);
  }
  closeDropdown(dropdownElement: ElementRef | any) {
    try {
      // Utiliser l'API Bootstrap directement
      const dropdownEl = dropdownElement?.nativeElement || dropdownElement;
      if (dropdownEl) {
        const dropdown = new (window as any).bootstrap.Dropdown(dropdownEl);
        dropdown.hide();
      }
    } catch (error) {
    }
  }
  toggleStatusDropdown() {
    this.isPeriodDropdownOpen = !this.isPeriodDropdownOpen;
  }
  getPeriodLabel(period?: string) {
    period = period || this.selectedPeriod;
    return this.optionsPeriodDatas.find(option => option.value === period)?.label;
  }
  getPeriodValue(period: string) {
    return this.optionsPeriodDatas.find(option => option.value === period)?.value;
  }
  // Fermer les dropdowns en cliquant ailleurs (optionnel)
  @HostListener('document:click', ['$event'])
  closeDropdownsOnOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isPeriodDropdownOpen = false;
    }
  }
  ngAfterViewInit() {
    this.setupCharts();
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
    const uid = this.auth.getUid();

    if (!token || !uid) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    try {
      const requests = [
        this.loadOrdersStats(headers, uid, this.dateStart, this.dateEnd), //damien
        this.loadTicketsStats(headers, uid, this.dateStart, this.dateEnd),
        this.loadActivitiesStats(headers, uid, this.dateStart, this.dateEnd),
        this.loadPharmaciesStats(headers, uid, this.dateStart, this.dateEnd),
        this.loadUsersStats(headers, uid,  this.dateStart, this.dateEnd),
        this.loadRecentActivities(headers, uid,  this.dateStart, this.dateEnd),
        this.loadChartData(headers, uid, this.dateStart, this.dateEnd)
      ];

      await Promise.all(requests);
      this.lastUpdated = new Date();

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      throw error;
    }
  }

  private async loadOrdersStats(headers: HttpHeaders, uid: string, dateStart: Date, dateEnd: Date ): Promise<void> {
    try {

      const response: any = await this.apiService.post(
        'pharmacy-management/dashboard/orders-stats',
        { uid, dateStart, dateEnd,  period: this.selectedPeriod },
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
          growthRate: response.data.growthRate || 0,
          orders: response.allOrders ? response.allOrders.map(order => new OrderClass(order)) : [],
        };
        // Nouvelles données pour le graphique
        this.periodStats = response.periodStats || [];
        this.periodType = response.periodType || 'month';
        this.countOrders = response.countOrders ?? 0;
        this.setupCharts();
      }
    } catch (error) {
      console.error('Erreur chargement stats commandes:', error);
    }
  }

  private async loadTicketsStats(headers: HttpHeaders, uid: string, dateStart: Date, dateEnd: Date ): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'pharmacy-management/dashboard/tickets-stats',
        { uid, dateStart, dateEnd },
        headers
      ).toPromise();

      if (response && !response.error) {
        this.stats.tickets = {
          total: response.data.total || 0,
          open: response.data.open || 0,
          inProgress: response.data.inProgress || 0,
          resolved: response.data.resolved || 0,
          urgent: response.data.urgent || 0,
          responseTime: response.data.responseTime || 0
        };
        this.recentTickets = response.recentTickets.map(item=> new Ticket(item)) || [];
      }
    } catch (error) {
      console.error('Erreur chargement stats tickets:', error);
    }
  }

  private async loadActivitiesStats(headers: HttpHeaders, uid: string, dateStart: Date, dateEnd: Date ): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'tools/activitiesStats',
        { uid, dateStart, dateEnd },
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

  private async loadPharmaciesStats(headers: HttpHeaders, uid: string, dateStart: Date, dateEnd: Date ): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'pharmacy-managment/pharmacies/stats',
        { uid, dateStart, dateEnd },
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

  private async loadUsersStats(headers: HttpHeaders, uid: string, dateStart: Date, dateEnd: Date ): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'pharmacy-management/users/stats',
        { uid, dateStart, dateEnd },
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

  private async loadRecentActivities(headers: HttpHeaders, uid: string, dateStart: Date, dateEnd: Date ): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'tools/activitiesAll',
        {
          uid,
          limit: 15,
          dateStart, dateEnd
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

  private async loadChartData(headers: HttpHeaders, uid: string, dateStart: Date, dateEnd: Date ): Promise<void> {
    try {
      const response: any = await this.apiService.post(
        'pharmacy-management/dashboard/charts-data',
        { uid, dateStart, dateEnd },
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

  private handleNewOrder(order: OrderClass): void {
    if (!this.stats.orders.orders.map(ord => ord.orderNumber).includes(order.orderNumber)) {
      this.stats.orders.total++;
      this.stats.orders.todayOrders += order.orderDate.toISOString() === new Date().toISOString() ? 1 : 0;
      this.stats.orders.revenue += order.totalAmount;

      this.stats.orders.orders.unshift(order);
      this.lastUpdated = new Date();
    }
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

  // Méthodes publiques pour les actions
  navigateToQuickAction(action: QuickAction): void {
    this.router.navigate([action.route]);
  }

  changeView(view: string): void {
    this.selectedView = view;
    this.setupCharts();
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
      'completed': 'badge-modern badge-success',
      'pending': 'badge-modern badge-warning',
      'cancelled': 'badge-modern badge-danger',
      'open': 'badge-modern badge-info',
      'in_progress': 'badge-modern badge-primary',
      'resolved': 'badge-modern badge-success'
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

  initMainStatsChart() {
    if (!this.periodStats || this.periodStats.length === 0) {
      return;
    }

    // Détruire le graphique existant s'il existe
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.periodStats.map(stat => stat.intervalShort);

    // Adapter le titre selon la période
    const titleMap = {
      'hour': `Évolution par heure - ${this.getPeriodLabel()}`,
      'day': `Évolution par jour - ${this.getPeriodLabel()}`,
      'month': 'Évolution sur 12 mois - Commandes, Revenus et Nouveaux Clients'
    };

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'line',
            label: 'Commandes',
            data: this.periodStats.map(stat => stat.orders),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'Revenus (€)',
            data: this.periodStats.map(stat => stat.revenue),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: '#22c55e',
            borderWidth: 1,
            yAxisID: 'y1'
          },
          {
            type: 'line',
            label: 'Nouveaux clients',
            data: this.periodStats.map(stat => stat.newCustomers),
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
            text: titleMap[this.periodType] || titleMap['month']
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
              text: this.getXAxisLabel()
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
    if (!this.periodStats || this.periodStats.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalNewCustomers: 0,
        averageOrdersPerMonth: 0,
        averageRevenuePerMonth: 0
      };
    }

    const totalOrders = this.periodStats.reduce((sum, stat) => sum + stat, 0);
    const totalRevenue = this.periodStats.reduce((sum, stat) => sum + stat.revenue, 0);
    const totalNewCustomers = this.periodStats.reduce((sum, stat) => sum + stat.newCustomers, 0);

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

  private renderOrdersChart(): void {
    if (!this.ordersChart?.nativeElement || !this.ordersChartData.labels?.length) return;

    const ctx = this.ordersChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.ordersChartInstance) {
      this.ordersChartInstance.destroy();
    }

    this.ordersChartInstance = new Chart(ctx, {
      type: 'line',
      data: this.ordersChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Évolution des Commandes'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Nombre de commandes'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Période'
            }
          }
        }
      }
    });
  }
  private renderRevenueChart(): void {
    if (!this.revenueChart?.nativeElement || !this.revenueChartData.labels?.length) return;

    const ctx = this.revenueChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.revenueChartInstance) {
      this.revenueChartInstance.destroy();
    }

    this.revenueChartInstance = new Chart(ctx, {
      type: 'bar',
      data: this.revenueChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Évolution des Revenus'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Revenus (€)'
            },
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(value as number);
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Période'
            }
          }
        }
      }
    });
  }
  private renderTicketsChart(): void {
    if (!this.ticketsChart?.nativeElement || !this.ticketsChartData.labels?.length) return;

    const ctx = this.ticketsChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.ticketsChartInstance) {
      this.ticketsChartInstance.destroy();
    }

    this.ticketsChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: this.ticketsChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Répartition des Tickets par Statut'
          },
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
  }

// Méthodes pour la gestion des commandes
  applyOrdersFilter(): void {
    this.filteredRecentOrders = this.stats.orders.orders.filter(order => {
      let matches = true;

      if (this.ordersFilter.status && order.status !== this.ordersFilter.status) {
        matches = false;
      }

      if (this.ordersFilter.pharmacy && order.pharmacy.id !== this.ordersFilter.pharmacy) {
        matches = false;
      }

      if (this.ordersFilter.dateFrom) {
        const orderDate = new Date(order.createdAt);
        const filterDate = new Date(this.ordersFilter.dateFrom);
        if (orderDate < filterDate) {
          matches = false;
        }
      }

      if (this.ordersFilter.dateTo) {
        const orderDate = new Date(order.createdAt);
        const filterDate = new Date(this.ordersFilter.dateTo);
        filterDate.setHours(23, 59, 59, 999);
        if (orderDate > filterDate) {
          matches = false;
        }
      }

      return matches;
    });
  }

  resetOrdersFilter(): void {
    this.ordersFilter = {
      status: '',
      pharmacy: '',
      dateFrom: '',
      dateTo: ''
    };
    this.filteredRecentOrders = [...this.stats.orders?.orders ?? []];
  }

  exportOrders(): void {
    const data = this.filteredRecentOrders.map(order => ({
      'ID Commande': order.orderNumber,
      'Client': order.customer.getFullName() || 'N/A',
      'Pharmacie': order.pharmacy.name || 'N/A',
      'Montant': order.totalAmount,
      'Statut': order.status,
      'Date': new Date(order.createdAt).toLocaleDateString('fr-FR')
    }));

    this.downloadCSV(data, 'commandes_dashboard.csv');
  }

  private downloadCSV(data: any[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

// Actions sur les commandes et tickets
  viewOrder(orderId: string): void {
    this.router.navigate(['/pharmacy/orders', orderId]);
  }

  editOrder(orderId: string): void {
    this.router.navigate(['/pharmacy/orders/edit', orderId]);
  }

  viewTicket(ticketId: string): void {
    this.router.navigate(['/pharmacy/support/', ticketId]);
  }

  editTicket(ticketId: string): void {
    this.router.navigate(['/pharmacy/support/edit', ticketId]);
  }

  trackByTicketId(index: number, ticket: Ticket): string {
    return ticket._id || index.toString();
  }

// Classes CSS pour les badges
  getPriorityBadgeClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'urgent': 'bg-danger',
      'high': 'bg-warning',
      'medium': 'bg-info',
      'low': 'bg-success'
    };
    return classes[priority] || 'bg-secondary';
  }

  private async loadAvailablePharmacies(): Promise<void> {
    const token = await this.auth.getRealToken();
    const uid = await this.auth.getUid();

    if (!token || !uid) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    try {
      const response: any = await this.apiService.post(
        'pharmacy-managment/pharmacies/list',
        { uid, active: true },
        headers
      ).toPromise();

      if (response && !response.error) {
        this.availablePharmacies = response.data.map((p: any) => CommonFunctions.mapToPharmacy(p));
      }
    } catch (error) {
      console.error('Erreur chargement pharmacies:', error);
    }
  }

  getXAxisLabel(): string {
    const labelMap = {
      'hour': 'Heures',
      'day': 'Jours',
      'month': 'Mois'
    };
    return labelMap[this.periodType] || 'Période';
  }

  getPeriodStatsSummary() {
    if (!this.periodStats || this.periodStats.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalNewCustomers: 0,
        averageOrdersPerPeriod: 0,
        averageRevenuePerPeriod: 0
      };
    }

    const totalOrders = this.periodStats.reduce((sum, stat) => sum + stat.orders, 0);
    const totalRevenue = this.periodStats.reduce((sum, stat) => sum + stat.revenue, 0);
    const totalNewCustomers = this.periodStats.reduce((sum, stat) => sum + stat.newCustomers, 0);
    const intervals = this.periodStats.length;

    return {
      totalOrders,
      totalRevenue,
      totalNewCustomers,
      averageOrdersPerPeriod: intervals > 0 ? Math.round(totalOrders / intervals) : 0,
      averageRevenuePerPeriod: intervals > 0 ? Math.round(totalRevenue / intervals) : 0
    };
  }

  ngOnDestroy(): void {
    [
      this.chart,
      this.ordersChartInstance,
      this.revenueChartInstance,
      this.ticketsChartInstance,
    ].forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });

    this.destroy$.next();
    this.destroy$.complete();
  }
  async exportDashboard(): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 14;
      const pageWidth = doc.internal.pageSize.getWidth();

      // === HEADER ===
      doc.setFontSize(18);
      doc.text("Rapport du Tableau de Bord", pageWidth / 2, margin, { align: "center" });
      doc.setFontSize(11);
      doc.text(`Période : ${this.getPeriodLabel()}`, margin, 30);
      doc.text(`Date d’export : ${new Date().toLocaleString("fr-FR")}`, margin, 37);

      // === SECTION 1 : Statistiques principales ===
      doc.setFontSize(14);
      doc.text("Statistiques Globales", margin, 50);

      autoTable(doc, {
        startY: 55,
        head: [["Indicateur", "Valeur"]],
        body: [
          ["Commandes Totales", this.formatNumber(this.stats.orders.total)],
          ["Revenus Totaux", this.formatCurrency(this.stats.orders.revenue)],
          ["Tickets Totaux", this.formatNumber(this.stats.tickets.total)],
          ["Activités Totales", this.formatNumber(this.stats.activities.total)],
          ["Pharmacies Totales", this.formatNumber(this.stats.pharmacies.total)],
          ["Utilisateurs Totaux", this.formatNumber(this.stats.users.total)]
        ],
      });

      // === SECTION 2 : Détail par période ===
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Détails par " + this.getXAxisLabel(), margin, 20);

      const periodRows = this.periodStats.map(stat => [
        stat.interval,
        stat.orders,
        this.formatCurrency(stat.revenue),
        this.formatCurrency(stat.profit),
        stat.newCustomers,
        stat.orders > 0 ? this.formatCurrency(stat.revenue / stat.orders) : "0 €"
      ]);

      autoTable(doc, {
        startY: 25,
        head: [["Intervalle", "Commandes", "Revenus", "Bénéfices", "Nouveaux Clients", "Rev/Commande"]],
        body: periodRows,
      });

      // === SECTION 3 : Commandes récentes ===
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Commandes Récentes", margin, 20);

      const orderRows = this.filteredRecentOrders.map(order => [
        order.orderNumber,
        order.customer?.getFullName() || "N/A",
        order.pharmacy?.name || "N/A",
        this.formatCurrency(order.totalAmount),
        order.status,
        new Date(order.createdAt).toLocaleDateString("fr-FR")
      ]);

      autoTable(doc, {
        startY: 25,
        head: [["ID", "Client", "Pharmacie", "Montant", "Statut", "Date"]],
        body: orderRows,
      });

      // === SECTION 4 : Tickets récents ===
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Tickets Récents", margin, 20);

      const ticketRows = this.recentTickets.map(ticket => [
        String(ticket.ticketNumber ?? ""),
        String(ticket.title ?? ""),
        String(ticket.createdBy?.name ?? "N/A"),
        String(ticket.priority ?? ""),
        String(ticket.status ?? ""),
        String(ticket.assignedTo ?? "Non assigné"),
        new Date(ticket.updatedAt).toLocaleString("fr-FR")
      ]);

      autoTable(doc, {
        startY: 25,
        head: [["ID", "Sujet", "Client", "Priorité", "Statut", "Assigné à", "Dernière MAJ"]],
        body: ticketRows,
      });

      // === SECTION 5 : Activités récentes ===
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Activités Récentes", margin, 20);

      const activityRows = this.recentActivities.map(act => [
        act.type,
        act.description || "",
        act.author || "N/A",
        new Date(act.createdAt).toLocaleString("fr-FR")
      ]);

      autoTable(doc, {
        startY: 25,
        head: [["Type", "Description", "Utilisateur", "Date"]],
        body: activityRows,
      });

      // === FOOTER ===
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} / ${pageCount}`, pageWidth - margin, 290, { align: "right" });
      }
      // === SECTION 6 : Graphiques ===
      const addChartToPDF = (canvasRef: ElementRef<HTMLCanvasElement>, title: string) => {
        const canvas = canvasRef?.nativeElement;
        if (canvas) {
          const imgData = canvas.toDataURL("image/png", 1.0);
          doc.addPage();
          doc.setFontSize(14);
          doc.text(title, margin, 20);
          doc.addImage(imgData, "PNG", margin, 30, pageWidth - 2 * margin, 120);
        }
      };

      addChartToPDF(this.chartCanvas, "Performance Globale");
      addChartToPDF(this.ordersChart, "Évolution des Commandes");
      addChartToPDF(this.revenueChart, "Évolution des Revenus");

      // Sauvegarde
      doc.save(`rapport-dashboard-${new Date().toISOString().slice(0,10)}.pdf`);
      this.loadingService.setLoading(false);
    } catch (error) {
      console.error("Erreur lors de l’export du dashboard :", error);
    }
  }
  protected readonly restrictions = PHARMACY_RESTRICTIONS;
}
