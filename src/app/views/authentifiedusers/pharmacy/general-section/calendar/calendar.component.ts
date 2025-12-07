import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Subject, takeUntil, interval } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import {OrderClass, OrderItem} from "../../../../../models/Order.class";
import { SharedModule } from "../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../controllers/services/auth.service";
import { ApiService } from "../../../../../controllers/services/api.service";
import { LoadingService } from "../../../../../controllers/services/loading.service";
import { UserDetails } from "../../../../../models/UserDatails";
import { ActivityLoged } from "../../../../../models/Activity.class";
import { PharmacyClass } from "../../../../../models/Pharmacy.class";
import { CommonFunctions } from "../../../../../controllers/comonsfunctions";
import {Conversation} from "../../../../../models/Conversation.class";
import {MiniChatService} from "../../../../../controllers/services/minichat.service";
import { formatCurrency } from '@angular/common';
import { Inject, LOCALE_ID } from '@angular/core';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  orders: OrderClass[];
  activities: ActivityLoged[];
  ordersCount: number;
  activitiesCount: number;
  hasEvents: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  type: 'order' | 'activity';
  date: Date;
  time: string;
  status: string;
  data: OrderClass | ActivityLoged;
  priority: 'low' | 'medium' | 'high';
  color: string;
  isExpanded?: boolean;
}

interface CalendarStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalActivities: number;
  averageOrderTime: number;
  busyDays: number;
}

@Component({
  selector: 'app-pharmacy-calendar-tracking',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarPharmacyTrackingComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  selectedDate: Date | null = null;
  viewMode: 'month' | 'week' | 'day' = 'month';

  calendarDays: CalendarDay[] = [];
  currentEvents: CalendarEvent[] = [];
  selectedDayEvents: CalendarEvent[] = [];

  orders: OrderClass[] = [];
  activities: ActivityLoged[] = [];

  calendarStats: CalendarStats = {
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalActivities: 0,
    averageOrderTime: 0,
    busyDays: 0
  };

  filterType: 'all' | 'orders' | 'activities' = 'all';
  filterStatus: 'all' | 'pending' | 'completed' | 'cancelled' = 'all';
  filterPriority: 'all' | 'low' | 'medium' | 'high' = 'all';
  pharmacies: PharmacyClass[];

  isLoading = false;
  userDetail: UserDetails;
  pharmaciesList: PharmacyClass[] = [];

  private destroy$ = new Subject<void>();
  private refreshTimer$ = interval(300000); // Refresh every 5 minutes

  monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  usersInfo: { [key: string]:{  name: string;  img: string;  } } | null = null;
  usersArray: Array<{ key: string, name:string}> = [];
  private namespace = 'internal_messaging';

  constructor(
    private auth: AuthService,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private chatService: MiniChatService,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        if (loaded) {
          this.userDetail = this.auth.getUserDetails();
          await this.initializeCalendar();
          // setTimeout(() => {
            this.goToToday();
          // }, 5000)
        }
      });

    // Auto-refresh des données
    this.refreshTimer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCalendarData();
      });
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeCalendar();
    setTimeout(() => {
    this.refreshCalendar();
    }, 3000)
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async connectToChat() {
    try {
      this.isLoading = true;

      const token = await this.auth.getRealToken();
      if (!token) {
        this.isLoading = false;
        return;
      }

      // Connexion au namespace spécifique pour les conversations
      this.chatService.connectToNamespace(this.namespace, token, this.userDetail.id);

      this.chatService.getOrders()
        .pipe(takeUntil(this.destroy$))
        .subscribe((order: OrderClass) => {
          const existingOrder = this.orders.find(ord => {
            return ord._id === order._id;
          });

          if (!existingOrder) {
            this.orders.unshift(order);
            this.processCalendarEvents();
          } else {
            // Mettre à jour la commande existante
            const index = this.orders.findIndex(ord => ord._id === order._id);
            if (index > -1) {
              this.orders[index] = new OrderClass(order);
            }
            this.processCalendarEvents();
          }
        });

      // Écoute des nouvelles activités avec filtrage par namespace
      this.chatService.getActivities()
        .pipe(takeUntil(this.destroy$))
        .subscribe((activity: ActivityLoged) => {
          if (activity.namespace === this.namespace) {
            const existingActivity = this.activities.find(notification => {
              return notification._id === activity._id;
            });

            if (!existingActivity) {
              this.activities.unshift(activity);
            }
          }
        });
    } catch (error) {
      console.error('❌ Erreur lors de la connexion au chat:', error);
      this.isLoading = false;
    }
  }


  private async initializeCalendar(): Promise<void> {
    this.selectedDate = new Date();
    await this.loadPharmacies();
    await this.loadCalendarData();
    this.generateCalendarDays();
  }

  async loadPharmacies(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      this.loadingService.setLoading(true);
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();
      if (!token) {
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });
      let listUsers = [{key:'',name:"Tous les utilisateurs"}];
      this.apiService.post('pharmacy-management/pharmacies/list', { uid, andUsersList:1 }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.pharmacies = response.data.map((item: any) => CommonFunctions.mapToPharmacy(item));
              response.usersArray.forEach((item: any) => listUsers.push(item));
              this.usersArray = listUsers;
            } else {
              this.pharmacies = [];
              this.usersArray = [];
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.loadingService.setLoading(false);
    }
  }

  private async loadCalendarData(): Promise<void> {
    this.isLoading = true;

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token || !uid) return;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      // Calculer la plage de dates (mois actuel + mois précédent et suivant)
      const startDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
      const endDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 2, 0);

      // Charger les commandes
      const ordersPayload = {
        uid,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };

      this.apiService.post('pharmacy-management/orders/list', ordersPayload, headers).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response?.data?.orders) {
              this.orders = response.data.orders.map((item: any) => new OrderClass(item));
              this.processCalendarEvents();
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement:', error);
            this.isLoading = false;
          }
        });
      if (this.pharmacies.length > 0) {
        const activitiesPayload = {
          uid,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        };
        this.apiService.post('tools/activitiesAll', activitiesPayload, headers).
          pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              if (response && !response.error && response.data){
                this.activities = response?.data || [];
                this.usersInfo = response?.usersMap || [];
              }
            }
          })

      }

      this.processCalendarEvents();
      this.calculateStats();
      this.generateCalendarDays();

      this.isLoading = false;

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      this.isLoading = false;
    }
  }

  private processCalendarEvents(): void {
    this.currentEvents = [];

    // Traiter les commandes
    this.orders.forEach(order => {
      const event: CalendarEvent = {
        id: order._id,
        title: `Commande #${order.orderNumber}`,
        type: 'order',
        date: new Date(order.orderDate),
        time: new Date(order.orderDate).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: order.status,
        data: order,
        priority: this.getOrderPriority(order),
        color: this.getOrderColor(order.status)
      };
      this.currentEvents.push(event);
    });

    // Traiter les activités
    this.activities.forEach(activity => {
      const event: CalendarEvent = {
        id: activity._id,
        title: activity.title || activity.type,
        type: 'activity',
        date: new Date(activity.createdAt),
        time: new Date(activity.createdAt).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: activity.type,
        data: activity,
        priority: this.getActivityPriority(activity),
        color: this.getActivityColor(activity.type)
      };
      this.currentEvents.push(event);
    });


    // Trier par date
    this.currentEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  }

  private generateCalendarDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Premier jour de la semaine à afficher
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // Dernier jour de la semaine à afficher
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    this.calendarDays = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayKeyCurrentDate = currentDate.toISOString().split("T")[0];
      const ccalendarDay: CalendarDay = {
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isSameDate(currentDate, new Date()),
        isSelected: this.selectedDate ? this.isSameDate(currentDate, this.selectedDate) : false,
        orders: [],
        activities: [],
        ordersCount: 0,
        activitiesCount: 0,
        hasEvents: false
      };
      this.orders.map(order => {
        const dayKey = new Date(order.createdAt.toISOString());
        dayKey.setDate(dayKey.getDate() - 1);

        if (dayKeyCurrentDate == dayKey.toISOString().split("T")[0]) {
          ccalendarDay.orders.push(order);
          ccalendarDay.ordersCount = ccalendarDay.orders.length;
          ccalendarDay.hasEvents = true;
        }
      })
      this.activities.map(activiy => {
        const dayKey = new Date(activiy.createdAt);
        dayKey.setDate(dayKey.getDate() - 1);

        if (dayKeyCurrentDate == dayKey.toISOString().split("T")[0]) {
          ccalendarDay.activities.push(activiy);
          ccalendarDay.activitiesCount = ccalendarDay.activities.length;
          ccalendarDay.hasEvents = true;
        }
      })
      this.calendarDays.push(ccalendarDay);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  private getEventsForDate(date: Date): CalendarEvent[] {
    this.currentEvents.forEach(event => {event.isExpanded = false;})
    return this.currentEvents.filter(event =>
      this.isSameDate(event.date, date) && this.shouldShowEvent(event)
    );
  }

  private shouldShowEvent(event: CalendarEvent): boolean {
    if (this.filterType !== 'all') return false;
    if (this.filterPriority !== 'all' && event.priority !== this.filterPriority) return false;

    if (this.filterStatus !== 'all') {
      if (event.type === 'order') {
        const order = event.data as OrderClass;
        if (this.filterStatus === 'pending' && !['confirmed', 'preparing'].includes(order.status)) return false;
        if (this.filterStatus === 'completed' && !['delivered', 'ready_for_pickup'].includes(order.status)) return false;
        if (this.filterStatus === 'cancelled' && order.status !== 'cancelled') return false;
      }
    }

    return true;
  }

  private calculateStats(): void {
    const totalOrders = this.orders.length;
    const completedOrders = this.orders.filter(o =>
      ['delivered', 'ready_for_pickup', 'completed'].includes(o.status)
    ).length;
    const pendingOrders = this.orders.filter(o =>
      ['confirmed', 'preparing'].includes(o.status)
    ).length;

    // Calculer les jours occupés (jours avec au moins un événement)
    const busyDays = new Set();
    this.currentEvents.forEach(event => {
      const dayKey = event.date.toDateString();
      busyDays.add(dayKey);
    });

    // Calculer le temps moyen de préparation des commandes
    const completedOrdersWithTimes = this.orders.filter(o =>
      ['delivered', 'ready_for_pickup', 'completed'].includes(o.status) && o.orderDate && o.deliveredAt
    );

    console.log(completedOrdersWithTimes);

    let averageTime = 0;
    if (completedOrdersWithTimes.length > 0) {
      const totalTime = completedOrdersWithTimes.reduce((sum, order) => {
        const start = order.orderDate!.getTime();
        const end = order.deliveredAt!.getTime();
        return sum + (end - start);
      }, 0);
      averageTime = Math.floor((totalTime / completedOrdersWithTimes.length) / 60000); // en minutes
    }

    this.calendarStats = {
      totalOrders,
      completedOrders,
      pendingOrders,
      totalActivities: this.activities.length,
      averageOrderTime: averageTime,
      busyDays: busyDays.size
    };
  }

  // Méthodes de navigation
  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.loadCalendarData();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.loadCalendarData();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.loadCalendarData();
  }

  selectDate(day: CalendarDay): void {
    this.selectedDate = new Date(day.date);
    this.selectedDayEvents = this.getEventsForDate(day.date);
    this.generateCalendarDays(); // Regénérer pour mettre à jour la sélection
  }

  // Méthodes d'utilitaires
  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private getOrderPriority(order: OrderClass): 'low' | 'medium' | 'high' {
    if (order.requiresPrescription()) return 'high';
    if (order.getTotalItems() > 5) return 'medium';
    return 'low';
  }

  private getActivityPriority(activity: ActivityLoged): 'low' | 'medium' | 'high' {
    const highPriorityTypes = ['validation', 'rejection', 'system'];
    if (highPriorityTypes.includes(activity.type)) return 'high';
    return 'medium';
  }

  private getOrderColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': '#6c757d',
      'confirmed': '#0d6efd',
      'preparing': '#fd7e14',
      'ready_for_pickup': '#198754',
      'delivered': '#20c997',
      'cancelled': '#dc3545'
    };
    return colors[status] || '#6c757d';
  }

  private getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      'message': '#0d6efd',
      'document': '#6f42c1',
      'user': '#198754',
      'system': '#fd7e14',
      'pharmacy': '#20c997',
      'validation': '#198754',
      'rejection': '#dc3545'
    };
    return colors[type] || '#6c757d';
  }

  // Méthodes de filtrage
  onFilterChange(type: 'type' | 'status' | 'priority', value: string): void {
    if (type === 'type') this.filterType = value as any;
    if (type === 'status') this.filterStatus = value as any;
    if (type === 'priority') this.filterPriority = value as any;

    this.generateCalendarDays();
  }

  // Méthodes de vue
  changeViewMode(mode: 'month' | 'week' | 'day'): void {
    this.viewMode = mode;
    // Implémenter la logique pour différents modes de vue
  }

  // Méthodes de formatage
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  }

  getMonthYear(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  // Méthodes d'interaction
  onEventClick(event: CalendarEvent): void {
    console.log('Event clicked:', event);
    // Implémenter l'ouverture d'un modal de détails
  }

  exportCalendar(): void {
    // Implémenter l'export des données du calendrier
    console.log('Export calendar data');
  }

  refreshCalendar(): void {
    this.loadCalendarData();
  }

  trackByDate(index: number, item: CalendarDay): string {
    return item.date.toDateString();
  }

  trackByEventId(index: number, item: CalendarEvent): string {
    return item.id;
  }
  toggleCardExpansion(event: CalendarEvent): void {
    const isCurrentlyExpanded = event.isExpanded;
    this.selectedDayEvents.forEach((e) => (e.isExpanded = false));
    if (!isCurrentlyExpanded) {
      event.isExpanded = true;
    }
  }
  getItemsEvent(event: CalendarEvent): OrderItem[] {
      return event.type === 'order' ? ( (event.data as OrderClass).items ?? []) : [];
  }
  getActivityDescription(event: CalendarEvent, type?: number): string {
    if (event.type === 'order') {
      const orderData = event.data as OrderClass;

      switch (type) {
        case 1:
          return orderData.items.length.toString();
        case 2:
          return orderData.orderNumber;
        case 3:
          // Utilisez le service @angular/common pour formater la devise
          return formatCurrency(orderData.totalAmount, this.locale, '€', 'EUR');
        case 4:
          return orderData.payment.status;
        case 5:
          return orderData.getDeliveryMethodLabel();
        case 6:
          return orderData.pharmacy?.name ?? ''; // Utilisez le '?' pour éviter une erreur si la pharmacie n'existe pas
        case 7:
          return orderData.getTotalItems().toString();
        default:
          // Cas par défaut si 'type' n'est pas spécifié ou invalide
          return orderData.customer?.getFullName() ?? '';
      }
    }

    if (event.type === 'activity') {
      const activityData = event.data as ActivityLoged;

      switch (type) {
        case 8:
          return activityData.author ?? '';
        case 9:
          return activityData.type;
        default:
          return activityData.description ?? '';
      }
    }

    return '';
  }
  protected readonly ActivityLoged = ActivityLoged;
}
