import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {ProductReviewClass} from "../../../../../../models/ReviewProduct.class";
import {UserDetails} from "../../../../../../models/UserDatails";
import {environment} from "../../../../../../../environments/environment";
import {SharedModule} from "../../../../../theme/shared/shared.module";
import {AuthService} from "../../../../../../controllers/services/auth.service";
import {ApiService} from "../../../../../../controllers/services/api.service";
import {OrderClass} from "../../../../../../models/Order.class";

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged'
}

interface ProductReviewStats {
  _id: string;
  productName: string;
  productSku: string;
  productImage?: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  uniqueCustomers: number;
  totalPurchases: number;
  productViews: number;
  totalQuantitySold: number;
  lastReviewDate?: Date;
  firstReviewDate?: Date;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  flaggedReviews: number;
  wouldRecommendPercentage: number;
  averageAspects: {
    quality?: number;
    service?: number;
    delivery?: number;
    value?: number;
  };
  helpfulVotesTotal: number;
  unhelpfulVotesTotal: number;
  verifiedPurchasesPercentage: number;
  recentReviews: any[];
}

@Component({
  selector: 'app-pharmacy-product-reviews-list',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule],
  templateUrl: './review-product.component.html',
  styleUrls: ['./review-product.component.scss']
})
export class ProductPharmacyReviewsListComponent implements OnInit, OnDestroy {
  productStats: ProductReviewStats[] = [];
  filteredStats: ProductReviewStats[] = [];
  selectedProductStats: ProductReviewStats | null = null;
  selectedReviews: ProductReviewClass[] = [];
  lastUpdated = new Date();

  searchText: string = '';
  ratingFilter: string = '';
  statusFilter: string = '';
  sortColumn: string = 'totalReviews';
  sortDirection: string = 'desc';
  selectedPeriod: string = '30d';

  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginationStart: number = 0;
  paginationEnd: number = 0;
  currentPage: number = 1;

  isLoading: boolean = false;
  errorMessage: string = '';
  isPeriodDropdownOpen: boolean = false;

  // Formulaires pour les modals
  moderationForm: FormGroup;
  responseForm: FormGroup;
  isSubmitting: boolean = false;

  permissions = {
    viewReviews: false,
    moderateReviews: false,
    respondToReviews: false,
    exportReviews: false,
  };

  optionsPeriodDatas = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '3m', label: '3 derniers mois' },
    { value: '6m', label: '6 derniers mois' },
    { value: '1y', label: '1 an' },
    { value: 'all', label: 'Toute la période' }
  ];

  ReviewStatus = ReviewStatus;

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;
  internatPathUrl = environment.internalPathUrl;

  @ViewChild('productReviewsModal') productReviewsModal: ElementRef | undefined;
  @ViewChild('moderationModal') moderationModal: ElementRef | undefined;
  @ViewChild('responseModal') responseModal: ElementRef | undefined;
  selectedReviewsLength: number = 0;

  constructor(
    modalService: NgbModal,
    private auth: AuthService,
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
    this.modalService = modalService;
    this.createForms();
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.permissions.viewReviews = this.userDetail.hasPermission('avis.view');
        this.permissions.moderateReviews = this.userDetail.hasPermission('avis.moderate');
        this.permissions.respondToReviews = this.userDetail.hasPermission('avis.delete');
        this.permissions.exportReviews = this.userDetail.hasPermission('avis.export');

        if (loaded && this.userDetail) {
          await this.loadProductReviewsStats();
        }
      });
  }

  createForms(): void {
    this.moderationForm = this.fb.group({
      status: ['', [Validators.required]],
      moderationNote: ['']
    });

    this.responseForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadProductReviewsStats(): Promise<void> {
    this.loadingService.setLoading(true);
    this.errorMessage = '';

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

      if (!this.permissions.viewReviews) {
        this.productStats = [];
        this.filterStats();
        return;
      }

      const payload = {
        uid,
        period: this.selectedPeriod
      };

      this.apiService.post('reviews/products-list', payload, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data && response.data.productStats) {
              this.productStats = response.data.productStats;
            } else {
              this.productStats = [];
            }
            this.filterStats();
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des avis produits');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
    this.lastUpdated = new Date();
  }

  filterStats(): void {
    let filtered = [...this.productStats];

    if (this.searchText) {
      const searchTerms = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(stat =>
        stat.productName?.toLowerCase().includes(searchTerms) ||
        stat.productSku?.toLowerCase().includes(searchTerms)
      );
    }

    if (this.ratingFilter) {
      const rating = parseFloat(this.ratingFilter);
      filtered = filtered.filter(stat => Math.floor(stat.averageRating) === rating);
    }

    if (this.statusFilter) {
      if (this.statusFilter === 'high_rating') {
        filtered = filtered.filter(stat => stat.averageRating >= 4);
      } else if (this.statusFilter === 'low_rating') {
        filtered = filtered.filter(stat => stat.averageRating < 3);
      } else if (this.statusFilter === 'pending_moderation') {
        filtered = filtered.filter(stat => stat.pendingReviews > 0);
      }
    }

    filtered = this.sortStats(filtered);

    this.filteredStats = filtered;
    this.totalPages = Math.max(1, Math.ceil(this.filteredStats.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updatePaginationInfo();
  }

  sortStats(stats: ProductReviewStats[]): ProductReviewStats[] {
    return stats.sort((a, b) => {
      let aValue: any = this.getPropertyValue(a, this.sortColumn);
      let bValue: any = this.getPropertyValue(b, this.sortColumn);

      if (aValue === null || aValue === undefined) aValue = 0;
      if (bValue === null || bValue === undefined) bValue = 0;

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
      this.filteredStats.length
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
      this.sortDirection = 'desc';
    }
    this.filterStats();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }

  getPaginatedStats(): ProductReviewStats[] {
    const start = this.permissions.viewReviews ? this.paginationStart : 0;
    const end = this.permissions.viewReviews ? this.paginationEnd : 0;
    return this.filteredStats.slice(start, end);
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

  // Méthodes utilitaires
  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }

  getRatingClass(rating: number): string {
    if (rating >= 4) return 'rating-excellent';
    if (rating >= 3) return 'rating-good';
    if (rating >= 2) return 'rating-average';
    return 'rating-poor';
  }

  getPeriodLabel(period: string): string {
    const option = this.optionsPeriodDatas.find(opt => opt.value === period);
    return option?.label || 'Période inconnue';
  }

  setDateIntervalFromPeriod(period: string): void {
    this.selectedPeriod = period;
    this.loadProductReviewsStats();
  }

  toggleStatusDropdown(): void {
    this.isPeriodDropdownOpen = !this.isPeriodDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  closeDropdownsOnOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isPeriodDropdownOpen = false;
    }
  }
  closeDropdown() {
    this.isPeriodDropdownOpen = false;
  }

  refreshDashboard(): void {
    this.loadProductReviewsStats();
  }

  exportDashboard(): void {
    try {
      const headers = [
        'Produit', 'SKU', 'Avis Total', 'Note Moyenne', 'Clients Uniques',
        'Achats Total', 'Vues Produit', 'Quantité Vendue', 'Recommandations %',
        'Avis Vérifiés %', 'Votes Utiles', 'En Attente', 'Approuvés'
      ];

      let csvContent = headers.join(',') + '\n';

      this.filteredStats.forEach(stat => {
        const row = [
          this.escapeCsvValue(stat.productName),
          this.escapeCsvValue(stat.productSku),
          stat.totalReviews.toString(),
          stat.averageRating.toFixed(2),
          stat.uniqueCustomers.toString(),
          stat.totalPurchases.toString(),
          stat.productViews.toString(),
          stat.totalQuantitySold.toString(),
          stat.wouldRecommendPercentage.toFixed(1) + '%',
          stat.verifiedPurchasesPercentage.toFixed(1) + '%',
          stat.helpfulVotesTotal.toString(),
          stat.pendingReviews.toString(),
          stat.approvedReviews.toString()
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `avis_produits_${new Date().toISOString().split('T')[0]}.csv`);
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

  clearFilters(): void {
    this.searchText = '';
    this.ratingFilter = '';
    this.statusFilter = '';
    this.filterStats();
  }

  // Méthodes pour les modals
  async viewProductReviews(productStats: ProductReviewStats): Promise<void> {
    this.selectedProductStats = productStats;
    await this.loadProductReviews(productStats._id);
   // // console.log(this.selectedReviews);
   //  return;
    this.modalService.open(this.productReviewsModal, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
  }

  async loadProductReviews(productId: string): Promise<void> {
    try {
      const token = await this.auth.getRealToken();
      const uid = this.auth.getUid();

      if (!token) return;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const payload = { productId, uid, period: this.selectedPeriod, limit:true };

      this.loadingService.setLoading(true);
      this.apiService.post('reviews/product-reviews', payload, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data && response.data.reviews) {
              this.selectedReviews = response.data.reviews.map((item: any) => new ProductReviewClass(item));
              this.selectedReviewsLength = response.data.total ?? 0;
            } else {
              this.selectedReviews = [];
              this.selectedReviewsLength = 0;
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des avis');
            this.selectedReviews = [];
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  closeModal(): void {
    this.modalService.dismissAll('ok');
  }

  private handleError(message: string): void {
    this.errorMessage = message;
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

  getStatusLabel(status: string): string {
    const statusLabels = {
      'pending': 'En attente',
      'approved': 'Approuvé',
      'rejected': 'Rejeté',
      'flagged': 'Signalé'
    };
    return statusLabels[status as keyof typeof statusLabels] || 'Inconnu';
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses = {
      'pending': 'badge-warning',
      'approved': 'badge-success',
      'rejected': 'badge-danger',
      'flagged': 'badge-secondary'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary';
  }

  protected readonly Object = Object;

  gotoselectedReviewPage() {
    this.closeModal();
    if (this.selectedProductStats){
      this.router.navigate(['/pharmacy/reviewspeproduct', this.selectedProductStats._id]);
    }
  }
  gotoselectedUniqueReviewPage(reviewId: string) {
    this.closeModal();
    if (reviewId){
      this.router.navigate(['/pharmacy/reviews-products', reviewId]);
    }
  }
}
