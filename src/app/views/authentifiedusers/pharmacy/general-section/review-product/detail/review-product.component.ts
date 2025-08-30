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

interface ReviewActivity {
  _id: string;
  action: string;
  performedBy: {
    name: string;
    email: string;
  };
  performedAt: Date;
  note?: string;
  previousStatus?: string;
  newStatus?: string;
}

@Component({
  selector: 'app-pharmacy-product-review-details',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './review-product.component.html',
  styleUrls: ['./review-product.component.scss']
})
export class ProductReviewDetailsPharmacyComponent implements OnInit, OnDestroy {

  review: ProductReviewClass | null = null;
  relatedReviews: ProductReviewClass[] = [];
  relatedReviewsOthers: ProductReviewClass[] = [];

  isLoading: boolean = false;
  errorMessage: string = '';

  // Formulaires
  moderationForm: FormGroup;
  responseForm: FormGroup;
  isSubmitting: boolean = false;

  // État de l'interface
  activeTab: string = 'details';
  isEditingResponse: boolean = false;

  permissions = {
    viewReviews: false,
    moderateReviews: false,
    respondToReviews: false,
    viewActivity: false,
  };

  isActionsDropdownOpen: boolean;
  totalOrdersByCustomer: number = 0;
  relatedReviewsLength: number = 0;
  relatedReviewsOtherLength: number = 0;

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;
  internatPathUrl = environment.internalPathUrl;

  @ViewChild('moderationModal') moderationModal: ElementRef | undefined;
  @ViewChild('deleteConfirmModal') deleteConfirmModal: ElementRef | undefined;
  relatedReviewsStartSlice: number = 10;
  relatedReviewsStartSliceOthers: number = 10;

  selectedActions: string = 'actions';
  // for admin
  // optionsActionsDatas = [
  //   { value: 'actions', label: 'Actions' },
  //   { value: 'approve', label: 'Approuver' },
  //   { value: 'rejet', label: 'Rejeter' },
  //   { value: 'signal', label: 'Signaler' },
  //   { value: 'advance', label: 'Modération avancée' },
  //   { value: 'delete', label: 'Supprimer' }
  // ];
  //for pharmacy
  optionsActionsDatas = [
    { value: 'actions', label: 'Demander une modification' },
    { value: 'approve', label: 'Approbation' },
    // { value: 'rejet', label: 'Rejeter' },
    { value: 'signal', label: 'Signalement' },
    // { value: 'advance', label: 'Modération avancée' },
    { value: 'delete', label: 'Suppression' }
  ];
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
        this.permissions.viewActivity = this.userDetail.hasPermission('avis.activity');

        if (loaded && this.userDetail) {
          const reviewId = this.route.snapshot.paramMap.get('id');
          if (reviewId) {
            await this.loadReviewDetails(reviewId);
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

  async loadMoreRelatedReviews(type: string): Promise<void> {
    let endPoint: string;
    if (type === 'others') {
      endPoint = 'review-related-customer';
      this.relatedReviewsStartSliceOthers += 10;
    } else {
      endPoint = 'review-related-product';
      this.relatedReviewsStartSlice += 10;
    }
    await this.loadReviewDetails(this.review?._id, type, endPoint);
  }
  async loadReviewDetails(reviewId: string, type?: string, endPoint?: string): Promise<void> {
    this.loadingService.setLoading(true);
    this.errorMessage = '';

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        this.router.navigate(['/pharmacy/reviews']);
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const payload = {
        customerID: this.review?.customer?._id,
        productID: this.review?.product?._id,
        reviewId,
        uid,
        relatedReviewsStartSlice : this.relatedReviewsStartSlice,
        relatedReviewsStartSliceOthers : this.relatedReviewsStartSliceOthers,
      };

      this.apiService.post('pharmacy-management/reviews/'+(endPoint ? endPoint : 'review-details'), payload, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              if (!type && !endPoint) {
                this.review = new ProductReviewClass(response.data.review);
                this.totalOrdersByCustomer = response.data.totalOrdersByCustomer || 0;

                this.relatedReviewsLength = response.data.relatedReviewsCount || 0;
                this.relatedReviewsOtherLength = response.data.relatedReviewsOthersCount || 0;

                if (this.review.pharmacyResponse?.message) {
                  this.responseForm.patchValue({
                    message: this.review.pharmacyResponse.message
                  });
                }
              }
              if (type === 'others' || (!type && !endPoint)) {
                this.relatedReviewsOthers = response.data.relatedReviewsOthers?.map((item: any) => new ProductReviewClass(item)) || [];
              }
              if (type !== 'others' || (!type && !endPoint)) {
                this.relatedReviews = response.data.relatedReviews?.map((item: any) => new ProductReviewClass(item)) || [];
              }
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des détails de l\'avis');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  // async updateReviewStatus(): Promise<void> {
  //   if (!this.review || !this.moderationForm.valid) return;
  //
  //   this.isSubmitting = true;
  //
  //   try {
  //     const token = await this.auth.getRealToken();
  //     const uid = await this.auth.getUid();
  //
  //     if (!token) {
  //       this.handleError('Vous n\'êtes pas autorisé');
  //       return;
  //     }
  //
  //     const headers = new HttpHeaders({
  //       'Authorization': `Bearer ${token}`,
  //       'Accept': 'application/json',
  //       'Content-Type': 'application/json'
  //     });
  //
  //     const payload = {
  //       reviewId: this.review._id,
  //       status: this.moderationForm.value.status,
  //       moderationNote: this.moderationForm.value.moderationNote,
  //       uid
  //     };
  //
  //     this.apiService.post('pharmacy-management/reviews/update-status', payload, headers)
  //       .pipe(takeUntil(this.destroy$))
  //       .subscribe({
  //         next: (response: any) => {
  //           this.showSuccess('Statut de l\'avis mis à jour avec succès');
  //           this.review!.status = this.moderationForm.value.status;
  //           this.modalService.dismissAll();
  //           this.loadReviewDetails(this.review!._id);
  //           this.isSubmitting = false;
  //         },
  //         error: (error) => {
  //           this.handleError('Erreur lors de la mise à jour du statut');
  //           this.isSubmitting = false;
  //         }
  //       });
  //   } catch (error) {
  //     this.handleError('Une erreur s\'est produite');
  //     this.isSubmitting = false;
  //   }
  // }

  async savePharmacyResponse(): Promise<void> {
    if (!this.review || !this.responseForm.valid) return;

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
        reviewId: this.review._id,
        message: this.responseForm.value.message,
        uid
      };

      this.apiService.post('pharmacy-management/reviews/pharmacy-response', payload, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.showSuccess('Réponse enregistrée avec succès');
            this.isEditingResponse = false;
            this.loadReviewDetails(this.review!._id);
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

  // async deleteReview(): Promise<void> {
  //   if (!this.review) return;
  //
  //   const result = await Swal.fire({
  //     title: 'Confirmer la suppression',
  //     text: 'Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.',
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonColor: '#dc3545',
  //     cancelButtonColor: '#6c757d',
  //     confirmButtonText: 'Oui, supprimer',
  //     cancelButtonText: 'Annuler'
  //   });
  //
  //   if (!result.isConfirmed) return;
  //
  //   this.isSubmitting = true;
  //
  //   try {
  //     const token = await this.auth.getRealToken();
  //     const uid = await this.auth.getUid();
  //
  //     if (!token) {
  //       this.handleError('Vous n\'êtes pas autorisé');
  //       return;
  //     }
  //
  //     const headers = new HttpHeaders({
  //       'Authorization': `Bearer ${token}`,
  //       'Accept': 'application/json',
  //       'Content-Type': 'application/json'
  //     });
  //
  //     const payload = {
  //       reviewId: this.review._id,
  //       uid
  //     };
  //
  //     this.apiService.post('pharmacy-management/reviews/delete', payload, headers)
  //       .pipe(takeUntil(this.destroy$))
  //       .subscribe({
  //         next: (response: any) => {
  //           this.showSuccess('Avis supprimé avec succès');
  //           this.router.navigate(['/pharmacy/reviews']);
  //           this.isSubmitting = false;
  //         },
  //         error: (error) => {
  //           this.handleError('Erreur lors de la suppression de l\'avis');
  //           this.isSubmitting = false;
  //         }
  //       });
  //   } catch (error) {
  //     this.handleError('Une erreur s\'est produite');
  //     this.isSubmitting = false;
  //   }
  // }

  // Méthodes pour les modals
  // openModerationModal(): void {
  //   if (!this.review) return;
  //
  //   this.moderationForm.patchValue({
  //     status: this.review.status,
  //     moderationNote: ''
  //   });
  //
  //   this.modalService.open(this.moderationModal, {
  //     size: 'md',
  //     backdrop: 'static',
  //     centered: true
  //   });
  // }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  // Actions rapides
  // async quickApprove(): Promise<void> {
  //   if (!this.review) return;
  //
  //   this.moderationForm.patchValue({
  //     status: 'approved',
  //     moderationNote: 'Approuvé rapidement'
  //   });
  //
  //   await this.updateReviewStatus();
  // }
  // async quickReject(): Promise<void> {
  //   if (!this.review) return;
  //
  //   this.moderationForm.patchValue({
  //     status: 'rejected',
  //     moderationNote: 'Rejeté rapidement'
  //   });
  //
  //   await this.updateReviewStatus();
  // }
  // async quickFlag(): Promise<void> {
  //   if (!this.review) return;
  //
  //   this.moderationForm.patchValue({
  //     status: 'flagged',
  //     moderationNote: 'Signalé pour révision'
  //   });
  //
  //   await this.updateReviewStatus();
  // }

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

  getActivityIcon(action: string): string {
    const icons = {
      'created': 'fa-plus-circle',
      'status_changed': 'fa-exchange-alt',
      'response_added': 'fa-reply',
      'response_updated': 'fa-edit',
      'flagged': 'fa-flag',
      'deleted': 'fa-trash'
    };
    return icons[action as keyof typeof icons] || 'fa-info-circle';
  }

  getActivityClass(action: string): string {
    const classes = {
      'created': 'text-info',
      'status_changed': 'text-primary',
      'response_added': 'text-success',
      'response_updated': 'text-warning',
      'flagged': 'text-danger',
      'deleted': 'text-danger'
    };
    return classes[action as keyof typeof classes] || 'text-muted';
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  toggleResponseEdit(): void {
    this.isEditingResponse = !this.isEditingResponse;

    if (this.isEditingResponse && this.review?.pharmacyResponse?.message) {
      this.responseForm.patchValue({
        message: this.review.pharmacyResponse.message
      });
    }
  }

  cancelResponseEdit(): void {
    this.isEditingResponse = false;
    this.responseForm.reset();
  }

  goBack(): void {
    this.location.back();
  }

  navigateToProduct(): void {
    if (this.review?.product?._id) {
      this.router.navigate(['/pharmacy/products', this.review.product._id]);
    }
  }

  navigateToCustomer(): void {
    if (this.review?.customer?._id) {
      this.router.navigate(['/pharmacy/customers', this.review.customer._id]);
    }
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
  getActivityTitle(action: string) {
    return "";
  }

  getActionLabel(period: string): string {
    const option = this.optionsActionsDatas.find(opt => opt.value === period);
    return option?.label || 'Inconnue';
  }
  toggleStatusDropdown(): void {
    this.isActionsDropdownOpen = !this.isActionsDropdownOpen;
  }
  @HostListener('document:click', ['$event'])
  closeDropdownsOnOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isActionsDropdownOpen = false;
    }
  }
  closeDropdown() {
    this.isActionsDropdownOpen = false;
  }

  // for admin
  // switch (value) {
  //   case 'actions': break;
  //   case 'approve': this.quickApprove(); break;
  //   // case 'rejet': this.quickReject(); break;
  //   // case 'signal': this.quickFlag(); break;
  //   case 'advance': this.openModerationModal(); break;
  //   // case 'delete': this.deleteReview(); break;
  //   default: break;
  // }

  async setActionToDo(value: any) {

    if (!this.review || this.selectedActions == value) return;
    const formData = {
      title: this.getActionLabel(value) + ` - Avis client : <b>Avis #${this.review._id.slice(-8)}</b>`,
      description: `Bonjour, je souhaite que vous preniez acte de ma demande concernant cet avis : <b>Avis #${this.review._id.slice(-8)}</b> avec l'<b>id : ${this.review._id} </b>`,
      category: 'general',
      priority: 'high',
      status: 'open',
      pharmacy: this.review.pharmacy?.id,
      isPrivate: false
    };

    await this.askChange(formData);
    this.selectedActions = value;
  }

  private async askChange(formData: any): Promise<void> {
    if (!this.review) return;

    this.isSubmitting = true;

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé');
        this.isSubmitting = false;
        return;
      }

      const _formData = {
        ...formData,
        uid,
        lastActivity: new Date().toISOString(),
      };

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      console.log(_formData);
      this.apiService.post('tools/tickets/create', _formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.showSuccess('Demande transmise avec succès !');
            this.modalService.dismissAll();
            this.loadReviewDetails(this.review!._id);
            this.isSubmitting = false;
          },
          error: () => {
            this.handleError('Erreur lors de la mise à jour du statut');
            this.isSubmitting = false;
          }
        });

    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.isSubmitting = false;
    }
  }
}
