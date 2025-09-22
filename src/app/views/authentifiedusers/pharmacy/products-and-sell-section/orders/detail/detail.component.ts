import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, HostListener } from '@angular/core';
import {CommonModule, Location} from "@angular/common";
import { SharedModule } from "../../../../../theme/shared/shared.module";
import { AuthService } from "../../../../../../controllers/services/auth.service";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../../controllers/services/api.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CommonFunctions } from "../../../../../../controllers/comonsfunctions";
import { UserDetails } from "../../../../../../models/UserDatails";
import { environment } from "../../../../../../../environments/environment";
import {InternalNotes, OrderClass, OrderItem} from "../../../../../../models/Order.class";
import { MiniChatService } from "../../../../../../controllers/services/minichat.service";
import {Product} from "../../../../../../models/Product";
import {PrescriptionClass} from "../../../../../../models/Prescription.class";

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
  selector: 'app-pharmacy-order-detail',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class PharmacyOrderDetailComponent implements OnInit, OnDestroy {
  @Input() orderId?: string;

  order: OrderClass | null = null;
  orderHistory: any[] = [];
  relatedOrders: OrderClass[] = [];

  // Loading states
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  isLoadingHistory: boolean = false;
  isLoadingRelated: boolean = false;

  // Active tabs
  activeTab: string = 'overview';

  // Forms
  updateStatusForm: FormGroup;
  addNoteForm: FormGroup;
  refundForm: FormGroup;
  returnForm: FormGroup;
  trackingForm: FormGroup;

  // Permissions
  permissions = {
    viewOrder: false,
    editOrder: false,
    deleteOrder: false,
    manageStatus: false,
    processRefunds: false,
    handleReturns: false,
    viewHistory: false,
    addNotes: false,
    manageTracking: false,
    viewRelatedOrders: false,
  };

  // Enums for templates
  OrderStatus = OrderStatus;
  PaymentStatus = PaymentStatus;
  PaymentMethod = PaymentMethod;
  DeliveryMethod = DeliveryMethod;

  // Modal references
  @ViewChild('updateStatusModal') updateStatusModal: ElementRef | undefined;
  @ViewChild('addNoteModal') addNoteModal: ElementRef | undefined;
  @ViewChild('refundModal') refundModal: ElementRef | undefined;
  @ViewChild('returnModal') returnModal: ElementRef | undefined;
  @ViewChild('trackingModal') trackingModal: ElementRef | undefined;
  @ViewChild('prescriptionModal') prescriptionModal: ElementRef | undefined;
  @ViewChild('printModal') printModal: ElementRef | undefined;
  @ViewChild('productModal') productModal: ElementRef | undefined;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;
  internalPathUrl = environment.internalPathUrl;

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;
  private namespace = 'internal_messaging';

  selectedProduct: Product = null;

  // Print options
  printOptions = {
    includeCustomerInfo: true,
    includeItems: true,
    includePayment: true,
    includeDelivery: true,
    includeNotes: false,
    format: 'invoice' // 'invoice' | 'receipt' | 'label'
  };
  prescriptionModalData: PrescriptionClass = null;

  constructor(
    modalService: NgbModal,
    private location: Location,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private chatService: MiniChatService,
  ) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
    this.modalService = modalService;
    this.initializeForms();
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.setPermissions();

        if (loaded && this.userDetail) {
          // Get order ID from route params if not provided as input
          if (!this.orderId) {
            this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
              this.orderId = params['id'];
              if (this.orderId) {
                this.loadOrder();
                this.connectToChat();
              }
            });
          } else {
            this.loadOrder();
            this.connectToChat();
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setPermissions(): void {
    this.permissions.viewOrder = this.userDetail.hasPermission('commandes.view');
    this.permissions.editOrder = this.userDetail.hasPermission('commandes.assign');
    this.permissions.deleteOrder = this.userDetail.hasPermission('commandes.cancel');
    this.permissions.manageStatus = this.userDetail.hasPermission('commandes.checkout');
    this.permissions.processRefunds = this.userDetail.hasPermission('commandes.assign');
    this.permissions.handleReturns = this.userDetail.hasPermission('commandes.assign');
    this.permissions.viewHistory = this.userDetail.hasPermission('commandes.historique');
    this.permissions.addNotes = this.userDetail.hasPermission('commandes.assign');
    this.permissions.manageTracking = this.userDetail.hasPermission('commandes.assign');
    this.permissions.viewRelatedOrders = this.userDetail.hasPermission('commandes.assign');
  }

  private initializeForms(): void {
    this.updateStatusForm = this.fb.group({
      status: ['', [Validators.required]],
      note: [''],
      trackingNumber: [''],
      estimatedDeliveryDate: [''],
      notifyCustomer: [true]
    });

    this.addNoteForm = this.fb.group({
      note: ['', [Validators.required]],
      type: ['internal', [Validators.required]], // internal, pharmacy, customer
      isPrivate: [false]
    });

    this.refundForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0)]],
      reason: ['', [Validators.required]],
      refundMethod: ['original', [Validators.required]], // original, manual
      notifyCustomer: [true]
    });

    this.returnForm = this.fb.group({
      reason: ['', [Validators.required]],
      condition: ['', [Validators.required]], // damaged, expired, wrong_item, changed_mind
      refundAmount: [''],
      restockable: [true],
      notifyCustomer: [true]
    });

    this.trackingForm = this.fb.group({
      trackingNumber: ['', [Validators.required]],
      carrier: [''],
      estimatedDelivery: [''],
      trackingUrl: ['']
    });
  }

  async connectToChat(): Promise<void> {
    try {
      const token = await this.auth.getRealToken();
      if (!token) return;

      this.chatService.connectToNamespace(this.namespace, token, this.userDetail.id);

      this.chatService.getOrders()
        .pipe(takeUntil(this.destroy$))
        .subscribe((updatedOrder: OrderClass) => {
          if (updatedOrder._id === this.order?._id) {
            this.order = new OrderClass(updatedOrder);
          }
        });

    } catch (error) {
      console.error('❌ Erreur lors de la connexion au chat:', error);
    }
  }

  async loadOrder(): Promise<void> {
    if (!this.orderId || !this.permissions.viewOrder) return;

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

      if (!this.permissions.viewOrder) {
        this.order = null;
        return;
      }

      this.apiService.post('pharmacy-management/orders/detail', {
        orderId: this.orderId,
        uid
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error && response.data) {
              this.order = new OrderClass(response.data.order);
              // Load additional data
              if (this.permissions.viewHistory) {
                this.loadOrderHistory();
              }
              if (this.permissions.viewRelatedOrders) {
                this.loadRelatedOrders();
              }
            } else {
              this.handleError('Commande introuvable');
              this.router.navigate(['/pharmacy/orders']);
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement de la commande');
            this.loadingService.setLoading(false);
            this.router.navigate(['/pharmacy/orders']);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  async loadOrderHistory(): Promise<void> {
    if (!this.orderId || !this.permissions.viewHistory) return;

    this.isLoadingHistory = true;
    try {
      const token = await this.auth.getRealToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      });

      this.apiService.post('pharmacy-management/orders/history', {
        orderId: this.orderId, uid : this.auth.getUid(),
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.orderHistory = response.data || [];
            }
            this.isLoadingHistory = false;
          },
          error: () => {
            this.isLoadingHistory = false;
          }
        });
    } catch (error) {
      this.isLoadingHistory = false;
    }
  }

  async loadRelatedOrders(): Promise<void> {
    if (!this.order?.customer?._id || !this.permissions.viewRelatedOrders) return;

    this.isLoadingRelated = true;
    try {
      const token = await this.auth.getRealToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      });

      this.apiService.post('pharmacy-management/orders/related', {
        customerId: this.order.customer._id,
        excludeOrderId: this.orderId,
        limit: 10
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.relatedOrders = (response.data || []).map((order: any) => new OrderClass(order));
            }
            this.isLoadingRelated = false;
          },
          error: () => {
            this.isLoadingRelated = false;
          }
        });
    } catch (error) {
      this.isLoadingRelated = false;
    }
  }

  // Tab management
  setActiveTab(tab: string): void {
    this.activeTab = tab;

    // Load additional data when tabs are activated
    switch (tab) {
      case 'history':
        if (this.orderHistory.length === 0) {
          this.loadOrderHistory();
        }
        break;
      case 'related':
        if (this.relatedOrders.length === 0) {
          this.loadRelatedOrders();
        }
        break;
    }
  }

  // Status management
  openUpdateStatusModal(): void {
    if (!this.order || !this.permissions.manageStatus) return;

    this.updateStatusForm.patchValue({
      status: this.order.status,
      trackingNumber: this.order.deliveryInfo.trackingNumber || ''
    });

    this.modalService.open(this.updateStatusModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async updateOrderStatus(): Promise<void> {
    if (!this.order || !this.updateStatusForm.valid) return;

    this.isSubmitting = true;
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const formData = {
        orderId: this.order._id,
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
              this.loadOrder();
              this.loadOrderHistory();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la mise à jour');
            }
            this.isSubmitting = false;
          },
          error: () => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  // Notes management
  openAddNoteModal(): void {
    if (!this.permissions.addNotes) return;

    this.addNoteForm.reset({
      type: 'internal',
      isPrivate: false
    });

    this.modalService.open(this.addNoteModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async addNote(): Promise<void> {
    if (!this.order || !this.addNoteForm.valid) return;

    this.isSubmitting = true;
    try {
      const token = await this.auth.getRealToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const noteData = {
        orderId: this.order._id,
        ...this.addNoteForm.value,
        addedBy: this.userDetail.id
      };

      this.apiService.post('pharmacy-management/orders/add-note', noteData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Note ajoutée avec succès');
              this.closeModal();
              this.loadOrder();
              this.loadOrderHistory();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de l\'ajout de la note');
            }
            this.isSubmitting = false;
          },
          error: () => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  // Refund management
  openRefundModal(): void {
    if (!this.order || !this.permissions.processRefunds) return;

    this.refundForm.patchValue({
      amount: this.order.totalAmount,
      refundMethod: 'original'
    });

    this.modalService.open(this.refundModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async processRefund(): Promise<void> {
    if (!this.order || !this.refundForm.valid) return;

    const confirmed = await this.showConfirmation(
      'Confirmer le remboursement',
      `Êtes-vous sûr de vouloir rembourser ${this.refundForm.value.amount}€ pour cette commande ?`,
      'Rembourser'
    );

    if (!confirmed) return;

    this.isSubmitting = true;
    try {
      const token = await this.auth.getRealToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const refundData = {
        orderId: this.order._id,
        ...this.refundForm.value,
        processedBy: this.userDetail.id
      };

      this.apiService.post('pharmacy-management/orders/process-refund', refundData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Remboursement traité avec succès');
              this.closeModal();
              this.loadOrder();
              this.loadOrderHistory();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors du traitement du remboursement');
            }
            this.isSubmitting = false;
          },
          error: () => {
            this.handleError('Erreur lors du traitement du remboursement');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  // Return management
  openReturnModal(): void {
    if (!this.order || !this.permissions.handleReturns) return;

    this.returnForm.patchValue({
      refundAmount: this.order.totalAmount
    });

    this.modalService.open(this.returnModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async processReturn(): Promise<void> {
    if (!this.order || !this.returnForm.valid) return;

    this.isSubmitting = true;
    try {
      const token = await this.auth.getRealToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const returnData = {
        orderId: this.order._id,
        ...this.returnForm.value,
        processedBy: this.userDetail.id
      };

      this.apiService.post('pharmacy-management/orders/process-return', returnData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Retour traité avec succès');
              this.closeModal();
              this.loadOrder();
              this.loadOrderHistory();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors du traitement du retour');
            }
            this.isSubmitting = false;
          },
          error: () => {
            this.handleError('Erreur lors du traitement du retour');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  // Tracking management
  openTrackingModal(): void {
    if (!this.order || !this.permissions.manageTracking) return;

    this.trackingForm.patchValue({
      trackingNumber: this.order.deliveryInfo.trackingNumber || '',
      carrier: this.order.deliveryInfo.deliveryProvider || ''
    });

    this.modalService.open(this.trackingModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async updateTracking(): Promise<void> {
    if (!this.order || !this.trackingForm.valid) return;

    this.isSubmitting = true;
    try {
      const token = await this.auth.getRealToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const trackingData = {
        orderId: this.order._id,
        ...this.trackingForm.value
      };

      this.apiService.post('pharmacy-management/orders/update-tracking', trackingData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Informations de suivi mises à jour');
              this.closeModal();
              this.loadOrder();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la mise à jour');
            }
            this.isSubmitting = false;
          },
          error: () => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  // Print functionality
  openPrintModal(): void {
    this.modalService.open(this.printModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  printOrder(format: string): void {
    if (!this.order) return;
    if (!['invoice', 'receipt', 'label'].includes(format)) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(this.generatePrintContent(format));
      printWindow.document.close();
      printWindow.print();
    }
  }

  private generatePrintContent(format: string): string {
    if (!this.order) return '';

    let content = `
      <html>
        <head>
          <title>Commande ${this.order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .section { margin: 15px 0; }
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${format === 'invoice' ? 'FACTURE' : format === 'receipt' ? 'REÇU' : 'ÉTIQUETTE'}</h2>
            <p>Commande: ${this.order.orderNumber}</p>
            <p>Date: ${new Date(this.order.orderDate).toLocaleDateString()}</p>
          </div>
    `;

    if (this.printOptions.includeCustomerInfo && this.order.customer) {
      content += `
        <div class="section">
          <h3>Informations client</h3>
          <p><strong>Nom:</strong> ${this.order.customer.getFullName()}</p>
          <p><strong>Email:</strong> ${this.order.customer.email}</p>
          ${this.order.customer.defaultPhone ? `<p><strong>Téléphone:</strong> ${this.order.customer.defaultPhone.digits}</p>` : ''}
        </div>
      `;
    }

    if (this.printOptions.includeItems) {
      content += `
        <div class="section">
          <h3>Articles</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
      `;

      this.order.items.forEach(item => {
        content += `
          <tr>
            <td>${item.product.name}</td>
            <td>${item.quantity}</td>
            <td>${item.unitPrice.toFixed(2)} €</td>
            <td>${item.totalPrice.toFixed(2)} €</td>
          </tr>
        `;
      });

      content += `
            </tbody>
          </table>
        </div>
      `;
    }

    if (this.printOptions.includePayment) {
      content += `
        <div class="section">
          <h3>Paiement</h3>
          <p><strong>Méthode:</strong> ${this.order.getPaymentMethodLabel()}</p>
          <p><strong>Statut:</strong> ${this.getPaymentStatusLabel(this.order.payment.status)}</p>
          <p class="total"><strong>Total:</strong> ${this.order.totalAmount.toFixed(2)} €</p>
        </div>
      `;
    }

    if (this.printOptions.includeDelivery) {
      content += `
        <div class="section">
          <h3>Livraison</h3>
          <p><strong>Méthode:</strong> ${this.order.getDeliveryMethodLabel()}</p>
          <p><strong>Adresse:</strong><br>
            ${this.order.deliveryInfo.address.firstName} ${this.order.deliveryInfo.address.lastName}<br>
            ${this.order.deliveryInfo.address.street}<br>
            ${this.order.deliveryInfo.address.postalCode} ${this.order.deliveryInfo.address.city}
          </p>
          ${this.order.deliveryInfo.trackingNumber ? `<p><strong>Suivi:</strong> ${this.order.deliveryInfo.trackingNumber}</p>` : ''}
        </div>
      `;
    }

    content += `
        </body>
      </html>
    `;

    return content;
  }

  // Delete order
  async deleteOrder(): Promise<void> {
    if (!this.order || !this.permissions.deleteOrder) return;

    const confirmed = await this.showConfirmation(
      'Supprimer la commande',
      `Êtes-vous sûr de vouloir supprimer la commande "${this.order.orderNumber}" ? Cette action est irréversible.`,
      'Supprimer'
    );

    if (!confirmed) return;

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      this.apiService.post('pharmacy-management/orders/delete', {
        id: this.order._id,
        uid
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Commande supprimée avec succès');
              this.router.navigate(['/pharmacy/orders']);
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de la suppression');
            }
          },
          error: () => {
            this.handleError('Erreur lors de la suppression de la commande');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  // Navigation
  goToCustomerDetail(): void {
    if (this.order?.customer?._id) {
      this.router.navigate(['/customers', this.order.customer._id]);
    }
  }

  goToPharmacyDetail(): void {
    if (this.order?.pharmacy?.id) {
      this.router.navigate(['/pharmacies', this.order.pharmacy.id]);
    }
  }

  goToRelatedOrder(orderId: string): void {
    this.router.navigate(['/pharmacy/orders', orderId]);
  }
  getPaymentStatusLabel(status: string): string {
    const key = status?.toUpperCase() as keyof typeof OrderStatus;
    return OrderStatus[key] ?? '';
  }
  // Utility methods
  closeModal(): void {
    this.modalService.dismissAll();
  }

  private handleSucces(message: string): void {
    Swal.fire({
      icon:'success',
      title: 'Felicitations',
      text: message,
    })
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
  formatDate(date: string | Date): string {
    if (!date) return '';

    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    if (amount == null) return '';

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  protected readonly console = console;

  canDelete() {
    return this.permissions.deleteOrder;
  }

  canProcessRefund() {
    return this.permissions.processRefunds;
  }

  canProcessReturn() {
    return this.permissions.handleReturns;
  }

  canAddNote() {
    return this.permissions.addNotes;
  }

  canUpdateStatus() {
    return this.permissions.editOrder;
  }

  async quickStatusUpdate(confirmed: string) {
    this.updateStatusForm.patchValue({
      status: confirmed
    });
    await this.updateOrderStatus();
  }
  // onPrescriptionFileSelected(event: Event): void {
  //   const target = event.target as HTMLInputElement;
  //   const file = target.files?.[0];
  //
  //   if (!file) {
  //     this.selectedPrescriptionFile = null;
  //     return;
  //   }
  //
  //   // Vérifier la taille du fichier (5MB max)
  //   const maxSize = 5 * 1024 * 1024; // 5MB
  //   if (file.size > maxSize) {
  //     this.handleError('Le fichier est trop volumineux. Taille maximale: 5MB');
  //     target.value = '';
  //     return;
  //   }
  //
  //   // Vérifier le type de fichier
  //   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  //   if (!allowedTypes.includes(file.type)) {
  //     this.handleError('Format de fichier non supporté. Utilisez: JPG, PNG ou PDF');
  //     target.value = '';
  //     return;
  //   }
  //
  //   this.selectedPrescriptionFile = file;
  // }


  viewPrescription(prescriptionDocument: PrescriptionClass, orderItem?: OrderItem): void {
    if (!prescriptionDocument) return;

    this.prescriptionModalData = orderItem ? orderItem?.prescriptionDocument : prescriptionDocument;

    this.modalService.open(this.prescriptionModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  viewProductDetails(product: Product): void {
    if (!product) return;

    this.selectedProduct = product;

    this.modalService.open(this.productModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }
  downloadPrescription(): void {
    if (!this.prescriptionModalData?.document) return;

    const link = document.createElement('a');
    link.href = this.prescriptionModalData?.document?.url;
    link.download = `ordonnance_${this.order?.orderNumber || 'commande'}.pdf`;
    link.click();
  }

  makeThing() {
    return this.order.items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  exportOrderData(json: string) {
  }

  uploadPrescription(item: OrderItem) {
  }

  getItemsTotal() {
    return this.order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  getPaymentStatusBadgeClass(status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded") {
    if (status) {
      switch (status) {
        case "pending":
          return "badge badge-warning";
        case "paid":
          return "badge badge-success";
        case "failed":
          return "badge badge-danger";
        case "refunded":
          return "badge badge-success";
        case "partially_refunded":
      }
    }
    return undefined;
  }

  isStatusCompleted(confirmed: string) {
    return confirmed == this.order.status;
  }

  goBack() {
    this.location.back();
  }

  openProductView() {
    this.closeModal();
    if (this.selectedProduct) {
      this.router.navigate(['/pharmacy/products', this.selectedProduct._id]);
    }
  }
  getClassForInternalNote(internalNote: InternalNotes) {
    switch (internalNote.type) {
      case 'to_pharmacy': return 'bg-warning';
      case 'to_person': return 'bg-success';
      case 'to_admin': return 'bg-info';
      case 'to_general': return 'bg-danger';
      default: return '';
    }
  }

  isVisibleInternalNote(internaNote: InternalNotes): boolean {
    switch (internaNote.type) {
      case 'to_pharmacy': return this.permissions.viewOrder;
      case 'to_person': return this.permissions.viewOrder && ([internaNote.from._id, internaNote.to._id].includes(this.userDetail.id));
      case 'to_admin': return this.permissions.viewOrder;
      case 'to_general': return this.permissions.viewOrder;
    }
  }

  getInternalNoteLabel(internalNote: InternalNotes) {
    switch (internalNote.type) {
      case "to_pharmacy": return 'Visible uniquement par les membres de la pharmacie';
      case "to_person": return 'Visible uniquement par vous et la personne mentione dans la note';
      case "to_admin": return 'Visible par les membres de votre pharmacie et par les administrateurs';
      case "to_general": return 'Visible par tous les utilisateurs';
    }
    return "";
  }

  // À ajouter dans votre composant TypeScript

  documentSettings = {
    invoiceTemplate: 'standard',
    exportFormat: 'A4',
    autoGenerate: true,
    emailToCustomer: false
  };

  /**
   * Obtient le label de l'étape actuelle du lifecycle
   */
  getLifecycleStageLabel(): string {
    const stageLabels = {
      'created': 'Commande créée',
      'validated': 'Validation en cours',
      'preparing': 'En préparation',
      'quality_check': 'Contrôle qualité',
      'ready': 'Prêt pour livraison/retrait',
      'delivered': 'Livré/Retiré',
      'completed': 'Finalisé et facturé'
    };

    return stageLabels[this.getCurrentLifecycleStage()] || 'État inconnu';
  }

  /**
   * Détermine l'étape actuelle du lifecycle basé sur le statut de la commande
   */
  getCurrentLifecycleStage(): string {
    if (!this.order) return 'created';

    if (['cancelled', 'refunded', 'returned'].includes(this.order.status)) {
      return 'completed';
    }

    if (this.order.status === 'delivered') { //&& this.order.invoiceGenerated
      return 'completed';
    }

    if (this.order.status === 'completed') {
      return 'delivered';
    }

    if (['out_for_delivery', 'ready_for_pickup'].includes(this.order.status)) {
      return 'ready';
    }

    if (this.order.status === 'preparing') {
      return 'preparing';
    }

    if (['confirmed', 'prescription_pending'].includes(this.order.status)) {
      return 'validated';
    }

    return 'created';
  }

  /**
   * Obtient l'index de l'étape actuelle (pour le calcul du pourcentage)
   */
  getCurrentStageIndex(): number {
    const stages = ['created', 'validated', 'preparing', 'quality_check', 'ready', 'delivered', 'completed'];
    return stages.indexOf(this.getCurrentLifecycleStage()) + 1;
  }

  /**
   * Obtient le nombre total d'étapes
   */
  getTotalStages(): number {
    return 7;
  }

  /**
   * Calcule le pourcentage de progression du lifecycle
   */
  getLifecycleProgress(): number {
    const currentIndex = this.getCurrentStageIndex();
    const totalStages = this.getTotalStages();
    return Math.round((currentIndex / totalStages) * 100);
  }

  /**
   * Vérifie si une étape est complétée
   */
  isStageCompleted(stage: string): boolean {
    const stageOrder = ['created', 'validated', 'preparing', 'quality_check', 'ready', 'delivered', 'completed'];
    const currentStageIndex = stageOrder.indexOf(this.getCurrentLifecycleStage());
    const checkStageIndex = stageOrder.indexOf(stage);

    return checkStageIndex <= currentStageIndex;
  }

  /**
   * Vérifie si une étape est actuellement active
   */
  isStageActive(stage: string): boolean {
    return this.getCurrentLifecycleStage() === stage;
  }

  /**
   * Obtient les détails de l'étape actuelle avec actions possibles
   */
  getCurrentStageDetails(): any {
    const stage = this.getCurrentLifecycleStage();

    const stageDetails = {
      'created': {
        title: 'Commande en attente de validation',
        description: 'La commande doit être confirmée avant de passer à la préparation.',
        actions: [
          { key: 'confirm', label: 'Confirmer', icon: 'fa-check' }
        ]
      },
      'validated': {
        title: this.order.requiresPrescription() ? 'Validation des ordonnances' : 'Commande validée',
        description: this.order.requiresPrescription()
          ? 'En attente de réception/validation des ordonnances requises.'
          : 'Commande validée, prête pour la préparation.',
        actions: this.order.requiresPrescription()
          ? [{ key: 'upload_prescription', label: 'Gérer ordonnances', icon: 'fa-prescription' }]
          : [{ key: 'start_preparing', label: 'Commencer préparation', icon: 'fa-play' }]
      },
      'preparing': {
        title: 'Préparation en cours',
        description: 'Les médicaments sont en cours de préparation par l\'équipe pharmaceutique.',
        actions: [
          { key: 'quality_check', label: 'Contrôle qualité', icon: 'fa-search' }
        ]
      },
      'quality_check': {
        title: 'Contrôle qualité',
        description: 'Vérification finale de la commande avant expédition/mise à disposition.',
        actions: [
          { key: 'mark_ready', label: 'Marquer prêt', icon: 'fa-check-circle' }
        ]
      },
      'ready': {
        title: this.order.deliveryInfo.method === 'pickup' ? 'Prêt pour retrait' : 'Prêt pour expédition',
        description: this.order.deliveryInfo.method === 'pickup'
          ? 'La commande est prête à être retirée en pharmacie.'
          : 'La commande est prête à être expédiée.',
        actions: this.order.deliveryInfo.method === 'pickup'
          ? [{ key: 'mark_picked_up', label: 'Marquer retiré', icon: 'fa-hand-holding' }]
          : [{ key: 'ship', label: 'Expédier', icon: 'fa-truck' }]
      },
      'delivered': {
        title: this.order.deliveryInfo.method === 'pickup' ? 'Commande retirée' : 'Commande livrée',
        description: 'La commande a été remise au client. Génération des documents finaux.',
        actions: [
          { key: 'generate_invoice', label: 'Générer facture', icon: 'fa-file-invoice' }
        ]
      },
      'completed': {
        title: 'Commande finalisée',
        description: 'La commande est terminée et tous les documents ont été générés.',
        actions: []
      }
    };

    return stageDetails[stage] || null;
  }

  /**
   * Exécute une action de l'étape actuelle
   */
  executeStageAction(actionKey: string): void {
    switch (actionKey) {
      case 'confirm':
        this.quickStatusUpdate('confirmed');
        break;
      case 'upload_prescription':
        this.manageOrderPrescriptions();
        break;
      case 'start_preparing':
        this.quickStatusUpdate('preparing');
        break;
      case 'mark_ready':
        this.quickStatusUpdate(this.order.deliveryInfo.method === 'pickup' ? 'ready_for_pickup' : 'out_for_delivery');
        break;
      case 'mark_picked_up':
      case 'ship':
        if (this.order.deliveryInfo.method === 'pickup') {
          this.quickStatusUpdate('delivered');
        } else {
          this.openTrackingModal();
        }
        break;
      case 'generate_invoice':
        this.generateInvoice();
        break;
      default:
        console.warn('Action non reconnue:', actionKey);
    }
  }

// ===== MÉTHODES PRESCRIPTIONS =====

  /**
   * Vérifie si toutes les ordonnances requises sont fournies
   */
  allPrescriptionsProvided(): boolean {
    if (!this.order.requiresPrescription()) return true;

    const prescriptionRequiredItems = this.order.items.filter(item => item.prescriptionRequired);
    return prescriptionRequiredItems.every(item => item.prescriptionProvided);
  }

  /**
   * Obtient le statut des ordonnances
   */
  getPrescriptionStatus(): string {
    if (!this.order.requiresPrescription()) return 'Non requise';

    const totalRequired = this.order.items.filter(item => item.prescriptionRequired).length;
    const totalProvided = this.order.items.filter(item => item.prescriptionRequired && item.prescriptionProvided).length;

    return `${totalProvided}/${totalRequired}`;
  }

  /**
   * Ouvre la modal de gestion des ordonnances
   */
  manageOrderPrescriptions(): void {
    // Implémentation pour ouvrir une modal de gestion globale des ordonnances
  }

// ===== MÉTHODES DOCUMENTS =====

  /**
   * Obtient le nombre de documents générés
   */
  getGeneratedDocumentsCount(): number {
    let count = 0;
    if (this.order.invoice) count++;
    if (this.order.bonfiscal) count++;
    // if (this.order.deliveryNoteGenerated) count++;
    return count;
  }

  /**
   * Vérifie si la facture peut être générée
   */
  canGenerateInvoice(): boolean {
    return this.order.status === 'delivered' &&
      this.order.payment.status === 'paid' &&
         !this.order.invoice &&
          this.permissions.viewOrder
  }

  /**
   * Vérifie si le bon fiscal peut être généré
   */
  canGenerateFiscalReceipt(): boolean {
    return this.order.payment.status === 'paid' && !this.order.bonfiscal && this.permissions.viewOrder;
  }

  /**
   * Vérifie si le bon de livraison peut être généré
   */
  // canGenerateDeliveryNote(): boolean {
  //   return ['preparing', 'ready_for_pickup', 'out_for_delivery'].includes(this.order.status) &&
  //     this.order.deliveryInfo.method !== 'pickup' &&
  //     this.permissions.addNotes //&& !this.order.deliveryNoteGenerated;
  // }

  /**
   * Génère la facture
   */
  generateInvoice(): void {
    if (this.isSubmitting || !this.canGenerateInvoice()) return;

    // this.isSubmitting = true;
    //
    // // Appel API pour générer la facture
    // this.orderService.generateInvoice(this.order._id).subscribe({
    //   next: (response) => {
    //     this.order.invoiceGenerated = true;
    //     this.order.invoiceNumber = response.invoiceNumber;
    //     this.order.invoiceGeneratedAt = new Date();
    //
    //     this.showSuccessMessage('Facture générée avec succès');
    //     this.isSubmitting = false;
    //   },
    //   error: (error) => {
    //     this.showErrorMessage('Erreur lors de la génération de la facture');
    //     this.isSubmitting = false;
    //   }
    // });
  }

  /**
   * Génère le bon fiscal
   */
  generateFiscalReceipt(): void {
    // if (this.isSubmitting || !this.canGenerateFiscalReceipt()) return;
    //
    // this.isSubmitting = true;
    //
    // this.orderService.generateFiscalReceipt(this.order._id).subscribe({
    //   next: (response) => {
    //     this.order.fiscalReceiptGenerated = true;
    //     this.order.fiscalReceiptNumber = response.receiptNumber;
    //     this.order.fiscalReceiptGeneratedAt = new Date();
    //
    //     this.showSuccessMessage('Bon fiscal généré avec succès');
    //     this.isSubmitting = false;
    //   },
    //   error: (error) => {
    //     this.showErrorMessage('Erreur lors de la génération du bon fiscal');
    //     this.isSubmitting = false;
    //   }
    // });
  }

  /**
   * Génère le bon de livraison
   */
  // generateDeliveryNote(): void {
  //   if (this.isSubmitting || !this.canGenerateDeliveryNote()) return;
  //   //
  //   // this.isSubmitting = true;
  //   //
  //   // this.orderService.generateDeliveryNote(this.order._id).subscribe({
  //   //   next: (response) => {
  //   //     this.order.deliveryNoteGenerated = true;
  //   //     this.order.deliveryNoteGeneratedAt = new Date();
  //   //
  //   //     this.showSuccessMessage('Bon de livraison généré avec succès');
  //   //     this.isSubmitting = false;
  //   //   },
  //   //   error: (error) => {
  //   //     this.showErrorMessage('Erreur lors de la génération du bon de livraison');
  //   //     this.isSubmitting = false;
  //   //   }
  //   // });
  // }

  /**
   * Visualise un document
   */
  viewDocument(documentType: string, typeDoc = 'pdfData'): void {
    console.log('=== Debug viewDocument ===');
    console.log('documentType:', documentType);
    console.log('typeDoc:', typeDoc);
    console.log('order:', this.order);

    const documentData = {
      'invoice': {
        'pdfData': this.order.invoice?.pdfData,
        'htmlData': this.order.invoice?.htmlData
      },
      'fiscal_receipt': {
        'pdfData': this.order.bonfiscal?.pdfData,
        'htmlData': this.order.bonfiscal?.htmlData
      },
    };

    console.log('documentData:', documentData);
    console.log('documentData[documentType]:', documentData[documentType]);

    const bufferData = documentData[documentType]?.[typeDoc];
    console.log('bufferData:', bufferData);

    if (bufferData) {
      if (typeDoc === 'pdfData') {
        this.handlePdfData(bufferData);
      } else if (typeDoc === 'htmlData') {
        this.handleHtmlData(bufferData);
      }
    } else {
      // Fallback vers htmlData si pdfData n'est pas disponible
      const htmlData = documentData[documentType]?.['htmlData'];
      console.log('Fallback htmlData:', htmlData);

      if (htmlData) {
        console.log(`PDF non disponible pour ${documentType}, ouverture de la version HTML`);
        this.handleHtmlData(htmlData);
      } else {
        console.warn(`Aucun document ${documentType} disponible (ni PDF ni HTML)`);
        this.showDocumentNotAvailableMessage(documentType);
      }
    }
  }

  private handlePdfData(bufferData: any): void {

    try {
      let pdfBuffer: ArrayBuffer;

      if (typeof bufferData === 'string') {
        // Si c'est une string base64, la décoder
        const binaryString = atob(bufferData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfBuffer = bytes.buffer;
      } else if (bufferData?.$binary?.base64) {
        // Gérer le format MongoDB avec $binary
        const base64Data = bufferData.$binary.base64;

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfBuffer = bytes.buffer;
      } else if (bufferData instanceof ArrayBuffer) {
        console.log('Processing ArrayBuffer');
        pdfBuffer = bufferData;
      } else {
        console.error('Format de données PDF non reconnu:', bufferData);
        return;
      }

      console.log('PDF buffer size:', pdfBuffer.byteLength);

      // Vérifier que le buffer n'est pas vide
      if (pdfBuffer.byteLength === 0) {
        return;
      }

      // Créer un Blob à partir du buffer
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

      // Créer une URL temporaire pour le blob
      const url = URL.createObjectURL(blob);

      // Ouvrir le document dans un nouvel onglet
      const newWindow = window.open(url, '_blank');

      if (!newWindow) {
        this.downloadFile(blob, 'document.pdf');
      }

      // Nettoyer l'URL après utilisation
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000); // Augmenté à 5 secondes

    } catch (error) {
    }
  }

  private handleHtmlData(htmlData: string): void {
    try {
      if (!htmlData || htmlData.length === 0) {
        return;
      }

      // Vérifier que c'est bien du HTML
      if (!htmlData.includes('<html') && !htmlData.includes('<!DOCTYPE')) {
      }

      // Créer un Blob avec le contenu HTML
      const blob = new Blob([htmlData], { type: 'text/html;charset=utf-8' });

      // Créer une URL temporaire pour le blob
      const url = URL.createObjectURL(blob);

      // Ouvrir le document HTML dans un nouvel onglet
      const newWindow = window.open(url, '_blank');

      if (!newWindow) {
        console.error('Impossible d\'ouvrir une nouvelle fenêtre (popup bloqué?)');
        this.showHtmlInModal(htmlData);
      }

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);

    } catch (error) {
    }
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private showHtmlInModal(htmlData: string): void {

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const content = document.createElement('div');
    content.style.backgroundColor = 'white';
    content.style.width = '90%';
    content.style.height = '90%';
    content.style.position = 'relative';
    content.style.overflow = 'auto';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => document.body.removeChild(modal);

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.srcdoc = htmlData;

    content.appendChild(closeBtn);
    content.appendChild(iframe);
    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  private showDocumentNotAvailableMessage(documentType: string): void {
    alert(`Document ${documentType} non disponible`);
  }

  /**
   * Télécharge un document
   */
  downloadDocument(documentType: string): void {
    // this.orderService.downloadDocument(this.order._id, documentType).subscribe({
    //   next: (blob) => {
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `${documentType}_${this.order.orderNumber}.pdf`;
    //     a.click();
    //     window.URL.revokeObjectURL(url);
    //   },
    //   error: (error) => {
    //     this.showErrorMessage('Erreur lors du téléchargement du document');
    //   }
    // });
  }

  /**
   * Vérifie si tous les documents requis sont générés
   */
  hasAllRequiredDocuments(): boolean {
    return false;
    // const requiredDocs = ['invoice', 'fiscal_receipt'];
    // if (this.order.deliveryMethod !== 'pickup') {
    //   requiredDocs.push('delivery_note');
    // }
    //
    // return requiredDocs.every(doc => {
    //   switch (doc) {
    //     case 'invoice': return this.order.invoiceGenerated;
    //     case 'fiscal_receipt': return this.order.fiscalReceiptGenerated;
    //     case 'delivery_note': return this.order.deliveryNoteGenerated;
    //     default: return false;
    //   }
    // });
  }

  /**
   * Vérifie si des documents ont été générés
   */
  hasGeneratedDocuments(): boolean {
    return this.order.invoice != null ||
      this.order.bonfiscal?.bonfiscalNumber != null;
  }

  /**
   * Vérifie si les documents peuvent être régénérés
   */
  canRegenerateDocuments(): boolean {
    const statusesForInvoiceGeneration = ['delivered', 'completed'];
    const statusesForBonFiscalGeneration = ['out_for_delivery', 'delivered', 'completed'];

    return (statusesForInvoiceGeneration.includes(this.order.status) || statusesForBonFiscalGeneration.includes(this.order.status)) && this.permissions.viewOrder;
  }

  /**
   * Régénère tous les documents
   */
  async regenerateAllDocuments(): Promise<void> {
    if (!this.canRegenerateDocuments()) return;

    if (confirm('Êtes-vous sûr de vouloir régénérer tous les documents ? Les anciens seront remplacés.')) {
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

        if (!this.permissions.viewOrder) {
          this.order = null;
          return;
        }
        this.loadingService.setLoading(true);

        this.apiService.post('pharmacy-management/order/regenerate-documents', {
          orderId: this.orderId,
          documentType:this.documentSettings.invoiceTemplate,
          format: this.documentSettings.exportFormat === 'pdf' ? 'pdf' : 'html',
          uid
        }, headers)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              if (response && !response.error && response.data) {
                this.order = new OrderClass(response.data);

                if (this.permissions.viewHistory) {
                  this.loadOrderHistory();
                }
                if (this.permissions.viewRelatedOrders) {
                  this.loadRelatedOrders();
                }
              } else {
                this.handleError('Commande introuvable');
                this.router.navigate(['/pharmacy/orders']);
              }
              this.loadingService.setLoading(false);
              this.handleSucces('Documents régénérés avec succès');
            },
            error: (error) => {
              this.handleError('Erreur lors du chargement de la commande');
              this.loadingService.setLoading(false);
              this.router.navigate(['/pharmacy/orders']);
            }
          });
      } catch (error) {
        this.handleError('Une erreur s\'est produite');
        this.loadingService.setLoading(false);
      }
    }
  }

  /**
   * Envoie tous les documents par email
   */
  async emailAllDocuments(toMe?: boolean): Promise<void> {

    if (!this.hasGeneratedDocuments()) return;

    if (!confirm('Êtes-vous sûr de vouloir transférer les documents par mail?')) {
      return;
    }

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token) {
        this.handleError('Vous n\'êtes pas effectué cette operation');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      if (!this.permissions.viewOrder) {
        this.order = null;
        return;
      }
      this.loadingService.setLoading(true);

      this.apiService.post('pharmacy-management/order/send-documents', {
        orderId: this.orderId,
        toMe,
        format: this.documentSettings.exportFormat === 'pdf' ? 'pdf' : 'html',
        documentType:this.documentSettings.invoiceTemplate,
        uid
      }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error && response.data) {
              this.order = new OrderClass(response.data);

              if (this.permissions.viewHistory) {
                this.loadOrderHistory();
              }
              if (this.permissions.viewRelatedOrders) {
                this.loadRelatedOrders();
              }
            } else {
              this.handleError('Commande introuvable');
              this.router.navigate(['/pharmacy/orders']);
            }
            this.loadingService.setLoading(false);
            this.handleSucces('Documents envoyés par email avec succès');
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement de la commande');
            this.loadingService.setLoading(false);
            this.router.navigate(['/pharmacy/orders']);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  /**
   * Télécharge tous les documents dans un ZIP
   */
  downloadAllDocuments(): void {
    if (!this.hasGeneratedDocuments()) return;

    // this.orderService.downloadAllDocuments(this.order._id).subscribe({
    //   next: (blob) => {
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `documents_commande_${this.order.orderNumber}.zip`;
    //     a.click();
    //     window.URL.revokeObjectURL(url);
    //   },
    //   error: (error) => {
    //     this.showErrorMessage('Erreur lors du téléchargement des documents');
    //   }
    // });
  }


  getDateStatus(status: string): Date | null {
    return this.order.statusHistory.find(h => h.status === status)?.timestamp ?? null;
  }

}
