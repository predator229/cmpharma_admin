import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../../theme/shared/shared.module";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {interval, Subject, takeUntil} from "rxjs";
import {Chart, ChartConfiguration, ChartData, registerables} from "chart.js";
import {UserDetails} from "../../../../../models/UserDatails";
import {AuthService} from "../../../../../controllers/services/auth.service";
import {ApiService} from "../../../../../controllers/services/api.service";
import {LoadingService} from "../../../../../controllers/services/loading.service";
import {MiniChatService} from "../../../../../controllers/services/minichat.service";
import {Router} from "@angular/router";
import {NotifyService} from "../../../../../controllers/services/notification.service";
import {HttpHeaders} from "@angular/common/http";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

Chart.register(...registerables);

@Component({
  selector: 'app-pharmacy-admin-stats',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class PharmacyAdminStats implements OnInit, OnDestroy {
  @ViewChild('ordersChart') ordersChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analyticsChartPerformance') analyticsChartPerformance!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analyticsChartCustomers') analyticsChartCustomers!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analyticsChartProducts') analyticsChartProducts!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ticketsChart', { static: false }) ticketsChart!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private ordersChartInstance?: Chart;
  private revenueChartInstance?: Chart;
  private ticketsChartInstance?: Chart;

  private analyticsChartPerformancesInstance?: Chart;
  private analyticsChartCustomersInstance?: Chart;
  private analyticsChartProductsInstance?: Chart;

  // Données pour les graphiques
  ordersChartData: ChartData = { labels: [], datasets: [] };
  revenueChartData: ChartData = { labels: [], datasets: [] };
  ticketsChartData: ChartData = { labels: [], datasets: [] };

  private destroy$ = new Subject<void>();
  private refreshTimer$ = interval(300000); // Refresh toutes les 5 minutes
  private namespace = 'internal_messaging';

  isConnected = false;
  errorMessage = '';
  userDetail: UserDetails;
  lastUpdated = new Date();

  analyticsDataPerformance = {
    conversionRate: 0,
    customerSatisfaction: 0,
    avgResponseTime: 0,
    retentionRate: 0
  };
  analyticsDataCustomers = {
    conversionRate: 0,
    customerSatisfaction: 0,
    avgResponseTime: 0,
    retentionRate: 0
  };
  analyticsDataProducts = {
    conversionRate: 0,
    customerSatisfaction: 0,
    avgResponseTime: 0,
    retentionRate: 0
  };

  private dataFetchsProducts: ChartData;
  private dataFetchsCustomers: ChartData;
  private dataFetchsPerformance: ChartData;

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
  isLoading = false;
  periodStats: any[] = [];

  analysticsLabels = ['performance', 'customers', 'products'];

  constructor(
    private auth: AuthService,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private chatService: MiniChatService,
    private fb: FormBuilder,
    private router: Router,
    private notify: NotifyService
  ) {

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
  }
  private async initializeDashboard(): Promise<void> {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadAllDashboardData(),
      ]);
    } catch (error) {
      console.error('❌ Erreur initialisation dashboard:', error);
      this.errorMessage = 'Erreur lors du chargement du dashboard';
    } finally {
      this.isLoading = false;
    }
  }
  async refreshDashboard(): Promise<void> {
    this.isLoading = true;
    try {
      await this.loadAllDashboardData();
    } catch (error) {
      console.error('❌ Erreur refresh dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }
  private setupCharts(): void {
    // Attendre que le DOM soit prêt
    setTimeout(() => {
      try {
        if (this.chartCanvas?.nativeElement) {
          this.renderMainStatsChart();
        }
        if (this.analyticsChartPerformance?.nativeElement ||
          this.analyticsChartCustomers?.nativeElement ||
          this.analyticsChartProducts?.nativeElement) {
          this.renderAnalyticsChart();
        }
        if (this.revenueChart?.nativeElement) {
          this.renderRevenueChart();
        }
        if (this.ticketsChart?.nativeElement) {
          this.renderTicketsChart();
        }
        if (this.ordersChart?.nativeElement) {
          this.renderOrdersChart();
        }
      } catch (error) {
        console.error('❌ Erreur lors du setup des charts:', error);
      }
    }, 100);
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
    if (this.auth.getUserDetails()) {
      this.loadAllDashboardData();
    }
  }
  private async loadAllDashboardData(): Promise<void> {
    console.log('🔄 Chargement des données dashboard');

    const token = await this.auth.getRealToken();
    const uid = this.auth.getUid();

    if (!token || !uid) {
      console.error('❌ Token ou UID manquant');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    try {
      // Charger les données en parallèle
      const requests = [
        this.loadOrdersStats(headers, uid, this.dateStart, this.dateEnd),
        this.loadChartData(headers, uid, this.dateStart, this.dateEnd),
        this.loadAnalyticsData('performance'),
        this.loadAnalyticsData('customers'),
        this.loadAnalyticsData('products'),
      ];

      await Promise.all(requests);

      console.log('✅ Données chargées, initialisation des graphiques');
      console.log('📊 Period stats:', this.periodStats);
      console.log('📈 Orders chart data:', this.ordersChartData);

      // Attendre un peu avant de setup les charts
      setTimeout(() => {
        this.setupCharts();
      }, 50);

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
        this.periodStats = response.periodStats || [];
        this.periodType = response.periodType || 'month';
      }
    } catch (error) {
      console.error('Erreur chargement stats commandes:', error);
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
  private async loadAnalyticsData(tab: string): Promise<void> {
    const token = await this.auth.getRealToken();
    const uid = this.auth.getUid();

    if (!token || !uid) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    try {
      const response: any = await this.apiService.post(
        `pharmacy-management/dashboard/analytics/${tab}`,
        { uid, dateStart: this.dateStart, dateEnd:this.dateEnd,  period: this.selectedPeriod },headers
      ).toPromise();

      if (response && !response.error) {
        // console.log('Analytics data:', response);
        switch (tab){
          case 'performance':
            this.analyticsDataPerformance = response.data
            this.dataFetchsPerformance = response.chartData ?? [];
            break;
          case 'customers':
            this.analyticsDataCustomers = response.data;
            this.dataFetchsCustomers = response.chartData ?? [];
            break;
          case 'products':
            this.analyticsDataProducts = response.data;
            this.dataFetchsProducts = response.chartData ?? [];
            break;
          default: break;
        }
      }
    } catch (error) {
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
  private renderAnalyticsChart() {

    for (const tab of this.analysticsLabels) {
      let ctx: CanvasRenderingContext2D | null = null;
      let chartData: ChartData = null;
      switch (tab) {
        case 'performance':
          if (!this.analyticsChartPerformance?.nativeElement) return;
          ctx = this.analyticsChartPerformance.nativeElement.getContext('2d');
          if (this.analyticsChartPerformancesInstance) {
            this.analyticsChartPerformancesInstance.destroy();
            this.analyticsChartPerformancesInstance = undefined;
          }
          chartData = this.dataFetchsPerformance;
          break;
        case 'customers':
          if (!this.analyticsChartCustomers?.nativeElement) return;
          ctx = this.analyticsChartCustomers.nativeElement.getContext('2d');
          if (this.analyticsChartCustomersInstance) {
            this.analyticsChartCustomersInstance.destroy();
            this.analyticsChartCustomersInstance = undefined;
          }
          chartData = this.dataFetchsCustomers;
          break;
        case 'products':
          if (!this.analyticsChartProducts?.nativeElement) return;
          ctx = this.analyticsChartProducts.nativeElement.getContext('2d');
          if (this.analyticsChartProductsInstance) {
            this.analyticsChartProductsInstance.destroy();
            this.analyticsChartProductsInstance = undefined;
          }
          chartData = this.dataFetchsProducts;
          break;
        default: return;
      }
      if (!ctx || !chartData) break;
      let chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.getAnalyticsChartTitle(tab)
          },
          legend: {
            display: true,
            position: 'top'
          }
        }
      };
      let config: ChartConfiguration = null;
      switch (tab) {
        case 'performance':
          chartOptions.scales = {
            y: { beginAtZero: true }
          };
          config = {
            type: 'line',
            data: chartData,
            options: chartOptions
          }
          break;
        case 'customers':
          chartOptions.scales = {
            y: { beginAtZero: true }
          };
          config = {
            type: 'bar',
            data: chartData,
            options: chartOptions
          }
          break;
        case 'products':
          chartOptions.plugins.legend.position = 'right';
          config = {
            type: 'doughnut',
            data: chartData,
            options: chartOptions
          }
          break;
      }
      switch (tab) {
        case 'performance':
          this.analyticsChartPerformancesInstance = new Chart(ctx, config);
          break;
        case 'customers':
          this.analyticsChartCustomersInstance = new Chart(ctx, config);
          break;
        case 'products':
          this.analyticsChartProductsInstance = new Chart(ctx, config);
          break;
        default: return;
      }
    }
  }
  private renderMainStatsChart() {
    console.log('🎯 Init main stats chart');

    if (!this.periodStats || this.periodStats.length === 0) {
      console.warn('⚠️ Pas de données periodStats disponibles');
      return;
    }

    if (!this.chartCanvas?.nativeElement) {
      console.error('❌ Element chartCanvas non trouvé');
      return;
    }

    // Détruire l'ancien chart s'il existe
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('❌ Impossible d\'obtenir le context 2D');
      return;
    }

    try {
      const labels = this.periodStats.map(stat => stat.intervalShort);
      console.log('📊 Labels:', labels);

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
              text: `Évolution - ${this.getPeriodLabel()}`
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
      console.log('✅ Chart principal créé avec succès');

    } catch (error) {
      console.error('❌ Erreur création chart principal:', error);
    }
  }

  private getAnalyticsChartTitle(chartType: string): string {
    const titles: { [key: string]: string } = {
      'performance': 'Performance Générale',
      'customers': 'Analyse Clients',
      'products': 'Répartition Produits'
    };
    return titles[chartType] || 'Analytiques';
  }
  getXAxisLabel(): string {
    const labelMap = {
      'hour': 'Heures',
      'day': 'Jours',
      'month': 'Mois'
    };
    return labelMap[this.periodType] || 'Période';
  }

  private destroyCharts() {
    console.log('🗑️ Destruction des charts...');

    // Méthode recommandée pour détruire tous les charts
    const charts = (Chart as any).instances;
    if (charts) {
      Object.keys(charts).forEach(key => {
        const chartInstance = charts[key];
        if (chartInstance) {
          console.log(`🗑️ Destruction du chart ID: ${key}`);
          chartInstance.destroy();
        }
      });
    }

    // Réinitialiser toutes nos références
    this.chart = undefined;
    this.ordersChartInstance = undefined;
    this.revenueChartInstance = undefined;
    this.ticketsChartInstance = undefined;
    this.analyticsChartPerformancesInstance = undefined;
    this.analyticsChartCustomersInstance = undefined;
    this.analyticsChartProductsInstance = undefined;

  }
  ngOnDestroy(): void {
    this.destroyCharts();
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
      doc.setFontSize(11);
      doc.text(`Période : ${this.getPeriodLabel()}`, margin, 30);
      doc.text(`Date d’export : ${new Date().toLocaleString("fr-FR")}`, margin, 37);

      // === SECTION 1 : Statistiques principales ===
      doc.setFontSize(14);
      doc.text("Statistiques Globales", margin, 50);

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

      addChartToPDF(this.analyticsChartPerformance, "Analyse des performances");
      addChartToPDF(this.analyticsChartCustomers, "Analyses des clients");
      addChartToPDF(this.analyticsChartProducts, "Analyses des produits");
      addChartToPDF(this.ordersChart, "Évolution des Commandes");
      addChartToPDF(this.revenueChart, "Évolution des Revenus");
      addChartToPDF(this.chartCanvas, "Performance Globale");

      // === FOOTER ===
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} / ${pageCount}`, pageWidth - margin, 290, { align: "right" });
      }

      // Sauvegarde
      doc.save(`rapport-dashboard-${new Date().toISOString().slice(0,10)}.pdf`);
      this.loadingService.setLoading(false);
    } catch (error) {
    }
  }
}
