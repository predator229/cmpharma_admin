import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Subject, takeUntil, interval, startWith } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import {OrderClass} from "../../../../models/Order.class";
import {SharedModule} from "../../../theme/shared/shared.module";
import {AuthService} from "../../../../controllers/services/auth.service";
import {ApiService} from "../../../../controllers/services/api.service";
import {LoadingService} from "../../../../controllers/services/loading.service";
import {MiniChatService} from "../../../../controllers/services/minichat.service";
import {UserDetails} from "../../../../models/UserDatails";
import {PharmacyClass} from "../../../../models/Pharmacy.class";
import {CommonFunctions} from "../../../../controllers/comonsfunctions";

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {NotifyService} from "../../../../controllers/services/notification.service";

registerLocaleData(localeFr, 'fr');

interface OrderCard {
  order: OrderClass;
  progress: number;
  estimatedTime: number;
  currentStep: string;
  isOverdue: boolean;
  preparationTime: number;
  startedAt?: Date;
}

interface QueueStats {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  averageTime: number;
  overdueCount: number;
}

@Component({
  selector: 'app-pharmacy-orders-en-cours',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './encours.component.html',
  styleUrls: ['./encours.component.scss']
})
export class PharmacyOrdersEnCoursComponent implements OnInit, OnDestroy {
  orderCards: OrderCard[] = [];
  preparingOrders: OrderCard[] = [];
  pendingOrders: OrderCard[] = [];
  readyOrders: OrderCard[] = [];

  queueStats: QueueStats = {
    total: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    averageTime: 0,
    overdueCount: 0
  };

  currentTime = new Date();
  isLoading = false;
  isConnected = false;
  isFullscreen = false;
  soundEnabled = true;

  userDetail: UserDetails;
  private namespace = 'internal_messaging';
  private destroy$ = new Subject<void>();
  private clockTimer$ = interval(1000);
  pharmaciesList: PharmacyClass[];

  constructor(
    private auth: AuthService,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private chatService: MiniChatService,
    // private notify: NotifyService
  ) {}

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        if (loaded) {
          this.userDetail = this.auth.getUserDetails();
          await this.initializeComponent();
        }
      });

    // Horloge en temps réel
    this.clockTimer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentTime = new Date();
        this.updateOrderTimes();
      });
  }

  ngOnDestroy(): void {
    this.chatService.disconnectFromNamespace(this.namespace);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeComponent(): Promise<void> {
    await this.connectToOrders();
    await this.loadOrders();
  }

  private async connectToOrders(): Promise<void> {
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

      // Statut de connexion
      this.chatService.getConnectionStatusForNamespace(this.namespace)
        .pipe(takeUntil(this.destroy$))
        .subscribe(connected => {
          this.isConnected = connected;
        });

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
    }
  }

  private async loadOrders(): Promise<void> {
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

      const payload = {
        uid,
        status: ['confirmed', 'preparing', 'ready_for_pickup']
      };

      this.apiService.post('pharmacy-management/orders/list', payload, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response?.data?.orders) {
              const orders = response.data.orders.map((item: any) => new OrderClass(item));
              this.pharmaciesList = response.data.user ? response.data.user?.pharmaciesManaged.forEach((item: any) => CommonFunctions.mapToPharmacy(item)) : [];
              this.processOrders(orders);
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement:', error);
            this.isLoading = false;
          }
        });

    } catch (error) {
      console.error('Erreur:', error);
      this.isLoading = false;
    }
  }

  private processOrders(orders: OrderClass[]): void {
    this.orderCards = orders.map(order => this.createOrderCard(order));
    this.categorizeOrders();
    this.updateStats();
  }

  private createOrderCard(order: OrderClass): OrderCard {
    const estimatedTime = this.calculateEstimatedTime(order);
    const preparationTime = this.calculatePreparationTime(order);
    const progress = this.calculateProgress(order);
    const currentStep = this.getCurrentStep(order);
    const isOverdue = this.isOrderOverdue(order, estimatedTime);

    return {
      order,
      progress,
      estimatedTime,
      currentStep,
      isOverdue,
      preparationTime,
      startedAt: order.status === 'preparing' ? order.confirmedAt : undefined
    };
  }

  private categorizeOrders(): void {
    this.preparingOrders = this.orderCards.filter(card =>
      card.order.status === 'preparing'
    ).sort((a, b) => {
      // Priorité: en retard > urgent > ancien
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      // if (a.order.priority !== b.order.priority) return a.order.priority === 'urgent' ? -1 : 1;
      return new Date(a.order.confirmedAt || 0).getTime() - new Date(b.order.confirmedAt || 0).getTime();
    });

    this.pendingOrders = this.orderCards.filter(card =>
      card.order.status === 'confirmed'
    ).sort((a, b) =>
      new Date(a.order.orderDate).getTime() - new Date(b.order.orderDate).getTime()
    );

    this.readyOrders = this.orderCards.filter(card =>
      card.order.status === 'ready_for_pickup'
    ).sort((a, b) => {
      const aReady = new Date(a.order.shippedAt || 0);
      const bReady = new Date(b.order.shippedAt || 0);
      return aReady.getTime() - bReady.getTime();
    });
  }

  private updateStats(): void {
    this.queueStats = {
      total: this.orderCards.length,
      pending: this.pendingOrders.length,
      preparing: this.preparingOrders.length,
      ready: this.readyOrders.length,
      averageTime: this.calculateAverageTime(),
      overdueCount: this.orderCards.filter(card => card.isOverdue).length
    };
  }

  private calculateEstimatedTime(order: OrderClass): number {
    // Base: 5 minutes + 2 minutes par article
    let baseTime = 5;
    let itemTime = order.getTotalItems() * 2;

    // Majoration si ordonnance requise
    if (order.requiresPrescription()) {
      baseTime += 10;
    }

    // Majoration selon la priorité
    // if (order.priority === 'urgent') {
    //   return Math.max(baseTime + itemTime - 5, 5);
    // }

    return baseTime + itemTime;
  }

  private calculatePreparationTime(order: OrderClass): number {
    if (order.status !== 'preparing' || !order.confirmedAt) return 0;

    const startTime = new Date(order.confirmedAt).getTime();
    const now = this.currentTime.getTime();
    return Math.floor((now - startTime) / 60000); // en minutes
  }

  private calculateProgress(order: OrderClass): number {
    switch (order.status) {
      case 'confirmed': return 0;
      case 'preparing':
        const preparationTime = this.calculatePreparationTime(order);
        const estimatedTime = this.calculateEstimatedTime(order);
        return Math.min((preparationTime / estimatedTime) * 100, 95);
      case 'ready_for_pickup': return 100;
      default: return 0;
    }
  }

  private getCurrentStep(order: OrderClass): string {
    switch (order.status) {
      case 'confirmed': return 'En attente de préparation';
      case 'preparing':
        const progress = this.calculateProgress(order);
        if (progress < 30) return 'Vérification ordonnance';
        if (progress < 70) return 'Préparation médicaments';
        return 'Vérification finale';
      case 'ready_for_pickup': return 'Prêt pour retrait';
      default: return 'Statut inconnu';
    }
  }

  private isOrderOverdue(order: OrderClass, estimatedTime: number): boolean {
    if (order.status !== 'preparing') return false;
    return this.calculatePreparationTime(order) > estimatedTime;
  }

  private calculateAverageTime(): number {
    if (this.preparingOrders.length === 0) return 0;
    const totalTime = this.preparingOrders.reduce((sum, card) => sum + card.preparationTime, 0);
    return Math.floor(totalTime / this.preparingOrders.length);
  }

  private updateOrderTimes(): void {
    this.orderCards.forEach(card => {
      if (card.order.status === 'preparing') {
        card.preparationTime = this.calculatePreparationTime(card.order);
        card.progress = this.calculateProgress(card.order);
        card.currentStep = this.getCurrentStep(card.order);
        card.isOverdue = this.isOrderOverdue(card.order, card.estimatedTime);
      }
    });

    this.categorizeOrders();
    this.updateStats();
  }

  private handleNewOrder(order: OrderClass): void {
    const existingIndex = this.orderCards.findIndex(card => card.order._id === order._id);

    if (existingIndex > -1) {
      this.orderCards[existingIndex] = this.createOrderCard(order);
    } else {
      this.orderCards.push(this.createOrderCard(order));
      // this.notify.custom(`Nouvelle commande reçue 🎉 #${order.orderNumber}`, 'receive');
    }

    this.categorizeOrders();
    this.updateStats();
  }

  // Actions utilisateur
  async startPreparation(order: OrderClass): Promise<void> {
    try {
      await this.updateOrderStatus(order, 'preparing', 'Préparation commencée');
    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
    }
  }

  async markAsReady(order: OrderClass): Promise<void> {
    try {
      await this.updateOrderStatus(order, 'ready_for_pickup', 'Commande prête pour retrait');
      if (this.soundEnabled) {
        this.playOrderReadySound();
      }
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  }

  async completeOrder(order: OrderClass): Promise<void> {
    try {
      await this.updateOrderStatus(order, 'delivered', 'Commande remise au client');
      // Retirer de la liste
      this.orderCards = this.orderCards.filter(card => card.order._id !== order._id);
      this.categorizeOrders();
      this.updateStats();
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
    }
  }

  private async updateOrderStatus(order: OrderClass, status: string, note: string): Promise<void> {
    const token = await this.auth.getRealToken();
    const uid = await this.auth.getUid();

    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    const payload = {
      orderId: order._id,
      status,
      note,
      uid
    };

    this.apiService.post('pharmacy-management/orders/update-status', payload, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Statut mis à jour:', response);
        },
        error: (error) => {
          console.error('Erreur mise à jour statut:', error);
        }
      });
  }

  // Utilitaires
  viewOrderDetails(order: OrderClass): void {
    // Implémenter l'ouverture d'un modal de détails
    console.log('Voir détails:', order);
  }

  notifyCustomer(order: OrderClass): void {
    // Implémenter la notification client
    console.log('Notifier client:', order);
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }

  @HostListener('document:fullscreenchange', [])
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }

  // Formatage
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  }

  getReadyDuration(order: OrderClass): string {
    if (!order.shippedAt) return '—';

    const readyTime = new Date(order.shippedAt).getTime();
    const now = this.currentTime.getTime();
    const diffMinutes = Math.floor((now - readyTime) / 60000);

    return this.formatDuration(diffMinutes);
  }

  isPickupOverdue(order: OrderClass): boolean {
    if (!order.shippedAt) return false;

    const readyTime = new Date(order.shippedAt).getTime();
    const now = this.currentTime.getTime();
    const diffMinutes = Math.floor((now - readyTime) / 60000);

    return diffMinutes > 60; // Plus d'1h d'attente
  }

  trackByOrderId(index: number, item: OrderCard): string {
    return item.order._id || index.toString();
  }

  private playNewOrderSound(): void {
    // Implémenter la lecture du son
  }

  private playOrderReadySound(): void {
    // Implémenter la lecture du son
  }
}
