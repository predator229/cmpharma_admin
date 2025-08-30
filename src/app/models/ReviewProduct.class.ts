import {CustomerClass} from "./Customer.class";
import {Product} from "./Product";
import {PharmacyClass} from "./Pharmacy.class";
import {OrderClass} from "./Order.class";
import {CommonFunctions} from "../controllers/comonsfunctions";
import {Admin} from "./Admin.class";

export interface ReviewAspects {
  quality?: number;
  service?: number;
  delivery?: number;
  value?: number;
}

export interface PharmacyResponse {
  message?: string;
  respondedAt?: Date;
  respondedBy?: Admin | null;
}

export class ProductReviewClass {
  _id?: string;

  customer: CustomerClass | null;
  pharmacy: PharmacyClass | null;
  product?: Product | null;
  order?: OrderClass | null;

  rating: number;
  title?: string;
  comment?: string;

  aspects: ReviewAspects;

  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderatedBy?: string;
  moderationNote?: string;

  helpfulVotes: number;
  unhelpfulVotes: number;

  isVerifiedPurchase: boolean;
  wouldRecommend?: boolean;

  pharmacyResponse: PharmacyResponse;
  userAgent?: string;
  clientIp?: string;

  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;

    this.customer = data.customer ? new CustomerClass(data.customer) : new CustomerClass({});
    this.product = data.product ? new Product(data.product) : null;
    this.pharmacy = data.pharmacy ? CommonFunctions.mapToPharmacy(data.pharmacy) : null;
    this.order = data.order ? new OrderClass(data.order) : null;

    this.rating = data.rating || 1;
    this.title = data.title;
    this.comment = data.comment;

    this.aspects = {
      quality: data.aspects?.quality,
      service: data.aspects?.service,
      delivery: data.aspects?.delivery,
      value: data.aspects?.value
    };

    this.status = data.status || 'pending';
    this.moderatedBy = data.moderatedBy;
    this.moderationNote = data.moderationNote;

    this.helpfulVotes = data.helpfulVotes || 0;
    this.unhelpfulVotes = data.unhelpfulVotes || 0;

    this.isVerifiedPurchase = data.isVerifiedPurchase ?? false;
    this.wouldRecommend = data.wouldRecommend;

    this.pharmacyResponse = {
      message: data.pharmacyResponse?.message,
      respondedAt: data.pharmacyResponse?.respondedAt ? new Date(data.pharmacyResponse.respondedAt) : undefined,
      respondedBy: data.pharmacyResponse?.respondedBy ? new Admin(data.pharmacyResponse?.respondedBy) : null
    };

    this.userAgent = data.userAgent ?? '';
    this.clientIp = data.clientIp ?? '';
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  getStatusLabel(): string {
    const statusLabels = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      flagged: 'Signalé'
    };
    return statusLabels[this.status] || 'Inconnu';
  }

  getStatusBadgeClass(): string {
    const statusClasses = {
      pending: 'bg-warning',
      approved: 'bg-success',
      rejected: 'bg-danger',
      flagged: 'bg-warning'
    };
    return statusClasses[this.status] || 'bg-secondary';
  }

  getStarRating(): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= this.rating ? 'filled' : 'empty');
    }
    return stars;
  }

  hasPharmacyResponse(): boolean {
    return !!this.pharmacyResponse.message;
  }

  getHelpfulnessRatio(): number {
    const total = this.helpfulVotes + this.unhelpfulVotes;
    return total > 0 ? (this.helpfulVotes / total) * 100 : 0;
  }

  isHelpful(): boolean {
    return this.getHelpfulnessRatio() >= 70;
  }
}
