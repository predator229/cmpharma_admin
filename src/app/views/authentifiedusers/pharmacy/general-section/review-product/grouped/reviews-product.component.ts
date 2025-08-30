import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import { CommonModule } from "@angular/common";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {ProductReviewClass} from "../../../../../../models/ReviewProduct.class";
import {UserDetails} from "../../../../../../models/UserDatails";
import {environment} from "../../../../../../../environments/environment";
import {SharedModule} from "../../../../../theme/shared/shared.module";
import {AuthService} from "../../../../../../controllers/services/auth.service";
import {ApiService} from "../../../../../../controllers/services/api.service";
import { Location } from '@angular/common';

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
  selector: 'app-pharmacy-product-reviews-by-product',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reviews-product.component.html',
  styleUrls: ['./reviews-product.component.scss']
})
export class ProductReviewsByProductComponent implements OnInit, OnDestroy {

  productStats: ProductReviewStats | null = null;
  reviews: ProductReviewClass[] = [];
  filteredReviews: ProductReviewClass[] = [];

  // Filtres et recherche
  searchText: string = '';
  statusFilter: string = '';
  ratingFilter: string = '';
  sortColumn: string = 'createdAt';
  sortDirection: string = 'desc';
  selectedPeriod: string = '30d';

  // Pagination
  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginationStart: number = 0;
  paginationEnd: number = 0;
  currentPage: number = 1;
  totalReviews: number = 0;

  // État de l'interface
  isLoading: boolean = false;
  errorMessage: string = '';
  isPeriodDropdownOpen: boolean = false;
  isActionsDropdownOpen: boolean = false;
  activeTab: string = 'overview';

  // Formulaires
  moderationForm: FormGroup;
  responseForm: FormGroup;
  isSubmitting: boolean = false;
  selectedReview: ProductReviewClass | null = null;
  isEditingResponse: boolean = false;

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

  optionsActionsDatas = [
    { value: 'actions', label: 'Actions en lot' },
    { value: 'approve_all', label: 'Approuver tous les avis en attente' },
    { value: 'export_product', label: 'Exporter les avis du produit' },
    { value: 'export_stats', label: 'Exporter les statistiques' }
  ];

  selectedActions: string = 'actions';

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;
  internatPathUrl = environment.internalPathUrl;

  @ViewChild('responseModal') responseModal: ElementRef | undefined;
  @ViewChild('moderationModal') moderationModal: ElementRef | undefined;

  constructor(
    modalService: NgbModal,
    private location: Location,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
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
        this.permissions.respondToReviews = this.userDetail.hasPermission('avis.respond');
        this.permissions.exportReviews = this.userDetail.hasPermission('avis.export');

        if (loaded && this.userDetail) {
          const productId = this.route.snapshot.paramMap.get('id');
          if (productId) {
            await this.loadProductDetails(productId);
          }
        }
      });
  }

  createForms(): void {
    this.moderationForm = this.fb.group({
      status: ['', [Validators.required]],
      moderationNote: ['', [Validators.maxLength(500)]]
    });

    this.responseForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadProductDetails(productId: string): Promise<void> {
    this.loadingService.setLoading(true);
    this.errorMessage = '';

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        this.router.navigate(['/pharmacy/reviews-products']);
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const payload = {
        productId,
        uid,
        period: this.selectedPeriod,
        page: this.currentPage,
        limit: this.itemsPerPage
      };

      this.apiService.post('pharmacy-management/reviews/product-reviews', payload, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              // Charger les statistiques du produit
              this.productStats = response.data.productStats || null;

              // Charger les avis
              this.reviews = response.data.reviews?.map((item: any) => new ProductReviewClass(item)) || [];
              this.totalReviews = response.data.total || 0;

              this.filterReviews();
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des détails du produit');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  filterReviews(): void {
    let filtered = [...this.reviews];

    if (this.searchText) {
      const searchTerms = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(review =>
        review.title?.toLowerCase().includes(searchTerms) ||
        review.comment?.toLowerCase().includes(searchTerms) ||
        review.customer?.getFullName()?.toLowerCase().includes(searchTerms)
      );
    }

    if (this.ratingFilter) {
      const rating = parseInt(this.ratingFilter);
      filtered = filtered.filter(review => Math.floor(review.rating) === rating);
    }

    if (this.statusFilter) {
      filtered = filtered.filter(review => review.status === this.statusFilter);
    }

    filtered = this.sortReviews(filtered);
    this.filteredReviews = filtered;
    this.updatePagination();
  }

  sortReviews(reviews: ProductReviewClass[]): ProductReviewClass[] {
    return reviews.sort((a, b) => {
      let aValue: any = this.getPropertyValue(a, this.sortColumn);
      let bValue: any = this.getPropertyValue(b, this.sortColumn);

      if (aValue === null || aValue === undefined) aValue = 0;
      if (bValue === null || bValue === undefined) bValue = 0;

      if (this.sortColumn === 'createdAt' || this.sortColumn === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
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

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredReviews.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.paginationStart = (this.currentPage - 1) * this.itemsPerPage;
    this.paginationEnd = Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredReviews.length
    );
  }

  pageChanged(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.filterReviews();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }

  getPaginatedReviews(): ProductReviewClass[] {
    return this.filteredReviews.slice(this.paginationStart, this.paginationEnd);
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

  // Actions sur les avis
  async openResponseModal(review: ProductReviewClass): Promise<void> {
    this.selectedReview = review;
    this.isEditingResponse = !!review.pharmacyResponse?.message;

    if (review.pharmacyResponse?.message) {
      this.responseForm.patchValue({
        message: review.pharmacyResponse.message
      });
    } else {
      this.responseForm.reset();
    }

    this.modalService.open(this.responseModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  async savePharmacyResponse(): Promise<void> {
    if (!this.selectedReview || !this.responseForm.valid) return;

    this.isSubmitting = true;

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const payload = {
        reviewId: this.selectedReview._id,
        message: this.responseForm.value.message,
        uid
      };

      this.apiService.post('pharmacy-management/reviews/pharmacy-response', payload, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.showSuccess('Réponse enregistrée avec succès');
            this.closeModal();
            this.loadProductDetails(this.productStats!._id);
            this.isSubmitting = false;
          },
          error: (error) => {
            this.handleError('Erreur lors de l\'enregistrement de la réponse');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }

  // Navigation
  goBack(): void {
    this.location.back();
  }

  navigateToReviewDetail(reviewId: string): void {
    this.router.navigate(['/pharmacy/reviews-products', reviewId]);
  }

  navigateToProduct(): void {
    if (this.productStats?._id) {
      this.router.navigate(['/pharmacy/products', this.productStats._id]);
    }
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

  getPeriodLabel(period: string): string {
    const option = this.optionsPeriodDatas.find(opt => opt.value === period);
    return option?.label || 'Période inconnue';
  }

  getActionLabel(action: string): string {
    const option = this.optionsActionsDatas.find(opt => opt.value === action);
    return option?.label || 'Actions';
  }

  // Gestion des onglets
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Gestion des dropdowns
  togglePeriodDropdown(): void {
    this.isPeriodDropdownOpen = !this.isPeriodDropdownOpen;
  }

  toggleActionsDropdown(): void {
    this.isActionsDropdownOpen = !this.isActionsDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  closeDropdownsOnOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isPeriodDropdownOpen = false;
      this.isActionsDropdownOpen = false;
    }
  }

  closeDropdown(): void {
    this.isPeriodDropdownOpen = false;
    this.isActionsDropdownOpen = false;
  }

  // Actions
  setDateIntervalFromPeriod(period: string): void {
    this.selectedPeriod = period;
    this.loadProductDetails(this.productStats!._id);
  }

  async setActionToDo(value: string): Promise<void> {
    if (!this.productStats || this.selectedActions === value) return;

    switch (value) {
      case 'actions':
        break;
      case 'approve_all':
        await this.approveAllPendingReviews();
        break;
      case 'export_product':
        this.exportProductReviews();
        break;
      case 'export_stats':
        this.exportProductStats();
        break;
    }

    this.selectedActions = value;
  }

  async approveAllPendingReviews(): Promise<void> {
    if (!this.productStats) return;

    const pendingReviews = this.reviews.filter(r => r.status === 'pending');
    if (pendingReviews.length === 0) {
      this.showSuccess('Aucun avis en attente pour ce produit');
      return;
    }

    const result = await Swal.fire({
      title: 'Confirmer l\'approbation',
      text: `Êtes-vous sûr de vouloir approuver ${pendingReviews.length} avis en attente ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, approuver',
      cancelButtonText: 'Annuler'
    });

    if (!result.isConfirmed) return;

    // Logique d'approbation en lot (à implémenter selon votre API)
    this.showSuccess(`${pendingReviews.length} avis approuvés avec succès`);
    this.loadProductDetails(this.productStats._id);
  }

  exportProductReviews(): void {
    try {
      const headers = [
        'ID', 'Client', 'Note', 'Titre', 'Commentaire', 'Statut',
        'Date création', 'Achat vérifié', 'Recommande', 'Votes utiles'
      ];

      let csvContent = headers.join(',') + '\n';

      this.filteredReviews.forEach(review => {
        const row = [
          review._id,
          this.escapeCsvValue(review.customer?.getFullName() || 'Anonyme'),
          review.rating.toString(),
          this.escapeCsvValue(review.title || ''),
          this.escapeCsvValue(review.comment || ''),
          this.getStatusLabel(review.status),
          new Date(review.createdAt).toLocaleDateString('fr-FR'),
          review.isVerifiedPurchase ? 'Oui' : 'Non',
          review.wouldRecommend !== undefined ? (review.wouldRecommend ? 'Oui' : 'Non') : 'N/A',
          review.helpfulVotes.toString()
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `avis_${this.productStats?.productSku}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.handleError('Erreur lors de l\'exportation des avis');
    }
  }

  exportProductStats(): void {
    if (!this.productStats) return;

    try {
      const data = {
        produit: this.productStats.productName,
        sku: this.productStats.productSku,
        note_moyenne: this.productStats.averageRating,
        total_avis: this.productStats.totalReviews,
        clients_uniques: this.productStats.uniqueCustomers,
        quantite_vendue: this.productStats.totalQuantitySold,
        pourcentage_recommandations: this.productStats.wouldRecommendPercentage,
        avis_verifies: this.productStats.verifiedPurchasesPercentage,
        en_attente: this.productStats.pendingReviews,
        approuves: this.productStats.approvedReviews,
        rejetes: this.productStats.rejectedReviews,
        signales: this.productStats.flaggedReviews
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `stats_${this.productStats.productSku}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.handleError('Erreur lors de l\'exportation des statistiques');
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
    this.filterReviews();
  }

  refreshData(): void {
    this.loadProductDetails(this.productStats!._id);
  }

  closeModal(): void {
    this.modalService.dismissAll();
    this.selectedReview = null;
    this.isEditingResponse = false;
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

  protected readonly Object = Object;
}
