import {CustomerClass} from "./Customer.class";
import {OrderClass} from "./Order.class";
import {Product} from "./Product";

export class NotificationClass {
  _id?: string;

  recipient: CustomerClass | null;

  type: 'order_confirmed' | 'order_shipped' | 'order_delivered' | 'prescription_needed' | 'prescription_validated' | 'promotion' | 'stock_alert' | 'payment_failed' | 'account_update';

  title: string;
  message: string;

  relatedOrder?: OrderClass | null;
  relatedProduct?: Product | null;

  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };

  status: 'pending' | 'sent' | 'delivered' | 'failed';
  readAt?: Date | null;
  sentAt?: Date | null;

  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;

    this.recipient = data.recipient ? new CustomerClass(data.recipient) : null;

    this.type = data.type || 'account_update';
    this.title = data.title || '';
    this.message = data.message || '';

    this.relatedOrder = data.relatedOrder ? new OrderClass(data.relatedOrder) : null;
    this.relatedProduct = data.relatedProduct ? new Product(data.relatedProduct) : null;

    this.channels = {
      email: data.channels?.email ?? false,
      sms: data.channels?.sms ?? false,
      push: data.channels?.push ?? false,
      inApp: data.channels?.inApp ?? true
    };

    this.status = data.status || 'pending';
    this.readAt = data.readAt ? new Date(data.readAt) : null;
    this.sentAt = data.sentAt ? new Date(data.sentAt) : null;

    this.priority = data.priority || 'medium';
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }

  getTypeLabel(): string {
    const typeLabels = {
      order_confirmed: 'Commande confirmée',
      order_shipped: 'Commande expédiée',
      order_delivered: 'Commande livrée',
      prescription_needed: 'Ordonnance requise',
      prescription_validated: 'Ordonnance validée',
      promotion: 'Promotion',
      stock_alert: 'Alerte stock',
      payment_failed: 'Paiement échoué',
      account_update: 'Mise à jour du compte'
    };
    return typeLabels[this.type] || 'Notification';
  }

  getStatusLabel(): string {
    const statusLabels = {
      pending: 'En attente',
      sent: 'Envoyée',
      delivered: 'Délivrée',
      failed: 'Échouée'
    };
    return statusLabels[this.status] || 'Inconnu';
  }

  getPriorityLabel(): string {
    const priorityLabels = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      urgent: 'Urgente'
    };
    return priorityLabels[this.priority] || 'Moyenne';
  }

  getPriorityBadgeClass(): string {
    const priorityClasses = {
      low: 'bg-secondary',
      medium: 'bg-info',
      high: 'bg-warning',
      urgent: 'bg-danger'
    };
    return priorityClasses[this.priority] || 'bg-info';
  }

  isRead(): boolean {
    return !!this.readAt;
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isSent(): boolean {
    return ['sent', 'delivered'].includes(this.status);
  }

  getChannelLabels(): string[] {
    const labels = [];
    if (this.channels.email) labels.push('Email');
    if (this.channels.sms) labels.push('SMS');
    if (this.channels.push) labels.push('Push');
    if (this.channels.inApp) labels.push('In-App');
    return labels;
  }

  getTimeSinceSent(): string {
    if (!this.sentAt) return 'Non envoyée';

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.sentAt.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays} jours`;
  }
}
