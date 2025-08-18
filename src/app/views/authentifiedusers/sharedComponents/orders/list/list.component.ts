import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../controllers/services/auth.service";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CommonFunctions } from "../../../../../controllers/comonsfunctions";
import { UserDetails } from "../../../../../models/UserDatails";
import { environment } from "../../../../../../environments/environment";
import { Select2 } from "ng-select2-component";
import { OrderClass } from "../../../../../models/Order.class";
import { CustomerClass } from "../../../../../models/Customer.class";
import { PharmacyClass } from "../../../../../models/Pharmacy.class";
import {MiniChatService} from "../../../../../controllers/services/minichat.service";

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PRESCRIPTION_PENDING = 'prescription_pending',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentMethod {
  CARD = 'card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  INSURANCE = 'insurance'
}

export enum DeliveryMethod {
  HOME_DELIVERY = 'home_delivery',
  PICKUP = 'pickup',
  EXPRESS = 'express',
  SCHEDULED = 'scheduled'
}

@Component({
  selector: 'app-pharmacy-order-list',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule], //Select2
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class PharmacyOrderListComponent implements OnInit, OnDestroy {
  orders: OrderClass[] = [];
  filteredOrders: OrderClass[] = [];
  selectedOrder: OrderClass | null = null;

  searchText: string = '';
  statusFilter: string = '';
  paymentStatusFilter: string = '';
  deliveryMethodFilter: string = '';
  pharmacyFilter: string = '';
  customerFilter: string = '';
  dateFromFilter: string = '';
  dateToFilter: string = '';
  sortColumn: string = 'orderDate';
  sortDirection: string = 'desc';

  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginationStart: number = 0;
  paginationEnd: number = 0;
  currentPage: number = 1;

  internatPathUrl = environment.internalPathUrl;

  permissions = {
    viewOrders: false,
    editOrders: false,
    deleteOrders: false,
    exportOrders: false,
    manageOrderStatus: false,
  };

  // Enums for templates
  OrderStatus = OrderStatus;
  PaymentStatus = PaymentStatus;
  PaymentMethod = PaymentMethod;
  DeliveryMethod = DeliveryMethod;

  updateStatusForm: FormGroup;
  isSubmitting: boolean = false;

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;

  isLoading: boolean = false;

  @ViewChild('orderDetailsModal') orderDetailsModal: ElementRef | undefined;
  @ViewChild('updateStatusModal') updateStatusModal: ElementRef | undefined;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;
  pharmaciesListArray: Array<{value: string, label: string}> = [];
  customersListArray: Array<{value: string, label: string}> = [];
  private namespace = 'internal_messaging';

  constructor(
    modalService: NgbModal,
    private auth: AuthService,
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private chatService: MiniChatService,
  ) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
    this.modalService = modalService;
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.permissions.viewOrders = this.userDetail.hasPermission('commandes.view');
        this.permissions.editOrders = this.userDetail.hasPermission('commandes.edit');
        this.permissions.deleteOrders = this.userDetail.hasPermission('commandes.delete');
        this.permissions.exportOrders = this.userDetail.hasPermission('commandes.export');
        this.permissions.manageOrderStatus = this.userDetail.hasPermission('commandes.manage_status');

        if (loaded && this.userDetail) {
          await this.loadOrders();
          this.connectToChat();
        }
      });

    this.createStatusForm();
  }
  async connectToChat() {
    try {
      this.isLoading = true;
      const token = await this.auth.getRealToken();
      if (!token) {
        this.isLoading = false;
        return;
      }
      this.chatService.connectToNamespace(this.namespace, token, this.userDetail.id);

      this.chatService.getOrders()
        .pipe(takeUntil(this.destroy$))
        .subscribe((order: OrderClass) => {
          const existingOrder = this.orders.find(ord => {
            return ord._id === order._id;
          });

          if (!existingOrder) {
            this.orders.unshift(order);
          } else {
            const index = this.orders.findIndex(ord => ord._id === order._id);
            if (index > -1) {
              this.orders[index] = order;
            }
          }
          this.filterOrders();
        });

    }catch (error) {
      console.error('❌ Erreur lors de la connexion au chat:', error);
      this.isLoading = false;
    }
  }

  createStatusForm(): FormGroup {
    return this.fb.group({
      status: ['', [Validators.required]],
      note: [''],
      trackingNumber: [''],
      estimatedDeliveryDate: ['']
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadOrders(): Promise<void> {
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

      if (!this.permissions.viewOrders) {
        this.orders = [];
        this.pharmaciesListArray = [];
        this.customersListArray = [];
        this.filterOrders();
        return;
      }

      this.apiService.post('pharmacy-management/orders/list', { uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data && response.data.orders && response.data.orders.length > 0) {
              this.orders = response.data.orders.map((item: any) => new OrderClass(item));
              this.filterOrders();
              this.pharmaciesListArray = response.pharmaciesList ?? [];
              this.customersListArray = response.customersList ?? [];
            } else {
              this.orders = [];
              this.filterOrders();
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des commandes');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  filterOrders(): void {
    let filtered = [...this.orders];

    if (this.searchText) {
      const searchTerms = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(o =>
        o.orderNumber?.toLowerCase().includes(searchTerms) ||
        o.customer?.getFullName().toLowerCase().includes(searchTerms) ||
        o.customer?.email?.toLowerCase().includes(searchTerms) ||
        o.pharmacy?.name?.toLowerCase().includes(searchTerms)
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(o => o.status === this.statusFilter);
    }

    if (this.paymentStatusFilter) {
      filtered = filtered.filter(o => o.payment.status === this.paymentStatusFilter);
    }

    if (this.deliveryMethodFilter) {
      filtered = filtered.filter(o => o.deliveryInfo.method === this.deliveryMethodFilter);
    }

    if (this.pharmacyFilter) {
      filtered = filtered.filter(o => o.pharmacy?.id === this.pharmacyFilter);
    }

    if (this.customerFilter) {
      filtered = filtered.filter(o => o.customer?._id === this.customerFilter);
    }

    if (this.dateFromFilter) {
      const fromDate = new Date(this.dateFromFilter);
      filtered = filtered.filter(o => new Date(o.orderDate) >= fromDate);
    }

    if (this.dateToFilter) {
      const toDate = new Date(this.dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => new Date(o.orderDate) <= toDate);
    }

    filtered = this.sortOrders(filtered);

    this.filteredOrders = filtered;
    this.totalPages = Math.max(1, Math.ceil(this.filteredOrders.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updatePaginationInfo();
  }

  sortOrders(orders: OrderClass[]): OrderClass[] {
    return orders.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      aValue = this.getPropertyValue(a, this.sortColumn);
      bValue = this.getPropertyValue(b, this.sortColumn);

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (this.sortColumn === 'orderDate' || this.sortColumn === 'createdAt' || this.sortColumn === 'updatedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
      } else {
        return aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
      }
    });
  }

  getPropertyValue(obj: any, path: string): any {
    const keys = path.split('.');
    return keys.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : null, obj);
  }

  updatePaginationInfo(): void {
    this.paginationStart = (this.currentPage - 1) * this.itemsPerPage;
    this.paginationEnd = Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredOrders.length
    );
  }

  pageChanged(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginationInfo();
    }
  }

  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filterOrders();
  }

  exportOrdersList(): void {
    try {
      const headers = ['N° Commande', 'Client', 'Pharmacie', 'Statut', 'Paiement', 'Montant', 'Date', 'Livraison'];

      let csvContent = headers.join(',') + '\n';

      this.filteredOrders.forEach(order => {
        const row = [
          this.escapeCsvValue(order.orderNumber),
          this.escapeCsvValue(order.customer?.getFullName() || ''),
          this.escapeCsvValue(order.pharmacy?.name || ''),
          this.escapeCsvValue(order.getStatusLabel()),
          this.escapeCsvValue(order.getPaymentMethodLabel()),
          order.totalAmount.toString(),
          this.escapeCsvValue(order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ''),
          this.escapeCsvValue(order.getDeliveryMethodLabel())
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.handleError('Erreur lors de l\'exportation des données');
    }
  }

  escapeCsvValue(value: string): string {
    if (!value) return '""';
    value = value.replace(/"/g, '""');
    return `"${value}"`;
  }

  viewOrderDetails(order: OrderClass): void {
    this.modalService.dismissAll('ok');
    if (order) {
      this.selectedOrder = order;
      setTimeout(() => {
        this.modalService.open(this.orderDetailsModal, {
          size: 'xl',
          backdrop: 'static',
          centered: true
        });
      }, 0);
    }
  }

  openUpdateStatusModal(order: OrderClass): void {
    this.selectedOrder = order;
    this.updateStatusForm = this.createStatusForm();
    this.updateStatusForm.patchValue({
      status: order.status,
      trackingNumber: order.deliveryInfo.trackingNumber || ''
    });

    this.modalService.dismissAll('ok');
    setTimeout(() => {
      this.modalService.open(this.updateStatusModal, {
        size: 'lg',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }

  async updateOrderStatus(): Promise<void> {
    if (!this.selectedOrder || !this.updateStatusForm.valid) {
      this.handleError("Veuillez remplir tous les champs obligatoires !");
      return;
    }

    try {
      this.isSubmitting = true;
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

      const formData = {
        orderId: this.selectedOrder._id,
        ...this.updateStatusForm.value,
        uid
      };

      this.apiService.post('pharmacy-management/orders/update-status', formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Statut de la commande mis à jour avec succès');
              this.closeModal();
              this.loadOrders();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la mise à jour');
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite. Veuillez réessayer!');
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    this.modalService.dismissAll('ok');
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

  async deleteOrder(order: OrderClass): Promise<void> {
    try {
      const confirmed = await this.showConfirmation(
        'Supprimer la commande',
        `Êtes-vous sûr de vouloir supprimer la commande "${order.orderNumber}" ? Cette action est irréversible.`,
        'Supprimer'
      );

      if (!confirmed) return;

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

      this.apiService.post('pharmacy-management/orders/delete', { id: order._id, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            const index = this.orders.findIndex(o => o._id === order._id);
            if (index > -1) {
              this.orders.splice(index, 1);
              this.filterOrders();
              this.showSuccess('Commande supprimée avec succès');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la suppression de la commande');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
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

  getPaginatedOrders(): OrderClass[] {
    const start = this.permissions.viewOrders ? this.paginationStart : 0;
    const end = this.permissions.viewOrders ? this.paginationEnd : 0;
    return this.filteredOrders.slice(start, end);
  }

  getPageNumbers(): number[] {
    const result: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        result.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        result.push(i);
      }
    }

    return result;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }

  clearFilters(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.paymentStatusFilter = '';
    this.deliveryMethodFilter = '';
    this.pharmacyFilter = '';
    this.customerFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.filterOrders();
  }

  // Méthodes utilitaires pour les templates
  getStatusLabel(status: string): string {
    const statusLabels = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'prescription_pending': 'En attente de prescription',
      'preparing': 'En préparation',
      'ready_for_pickup': 'Prête pour retrait',
      'out_for_delivery': 'En cours de livraison',
      'delivered': 'Livrée',
      'completed': 'Terminée',
      'cancelled': 'Annulée',
      'returned': 'Retournée',
      'refunded': 'Remboursée'
    };
    return statusLabels[status as keyof typeof statusLabels] || 'Inconnu';
  }

  getPaymentStatusLabel(status: string): string {
    const statusLabels = {
      'pending': 'En attente',
      'paid': 'Payé',
      'failed': 'Échoué',
      'refunded': 'Remboursé',
      'partially_refunded': 'Partiellement remboursé'
    };
    return statusLabels[status as keyof typeof statusLabels] || 'Inconnu';
  }

  getDeliveryMethodLabel(method: string): string {
    const methodLabels = {
      'home_delivery': 'Livraison à domicile',
      'pickup': 'Retrait en pharmacie',
      'express': 'Livraison express',
      'scheduled': 'Livraison programmée'
    };
    return methodLabels[method as keyof typeof methodLabels] || 'Inconnu';
  }

  getPaymentMethodLabel(method: string): string {
    const methodLabels = {
      'card': 'Carte bancaire',
      'paypal': 'PayPal',
      'bank_transfer': 'Virement bancaire',
      'cash': 'Espèces',
      'insurance': 'Assurance'
    };
    return methodLabels[method as keyof typeof methodLabels] || 'Inconnu';
  }
}
