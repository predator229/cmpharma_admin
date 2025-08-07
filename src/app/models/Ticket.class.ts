// Ticket.class.ts
import { FileClass } from "./File.class";
import {PharmacyClass} from "./Pharmacy.class";
import {CommonFunctions} from "../controllers/comonsfunctions";
import {Admin} from "./Admin.class";
import {TicketMessage} from "./TicketMessage.class";

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'pending';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'billing' | 'account' | 'feature_request' | 'bug_report' | 'general';

export class Ticket {
  _id?: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  // Participants
  createdBy: Admin;

  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    type: 'admin';
  };

  pharmacy: PharmacyClass;

  // Contenu
  messages: TicketMessage[];
  attachments: FileClass[];
  tags: string[];

  // Métadonnées
  lastActivity: Date;
  isPrivate: boolean;
  estimatedResolution?: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Ticket>) {
    this._id = data._id;
    this.ticketNumber = data.ticketNumber || this.generateTicketNumber();
    this.title = data.title || '';
    this.description = data.description || '';
    this.category = data.category || 'general';
    this.priority = data.priority || 'medium';
    this.status = data.status || 'open';

    this.createdBy = data.createdBy;

    this.assignedTo = data.assignedTo;

    this.pharmacy = CommonFunctions.mapToPharmacy(data.pharmacy);

    this.messages = data.messages?.map(msg => new TicketMessage(msg)) || [];
    this.attachments = data.attachments?.map(att => new FileClass(att)) || [];
    this.tags = data.tags || [];

    this.lastActivity = data.lastActivity || new Date();
    this.isPrivate = data.isPrivate || false;
    this.estimatedResolution = data.estimatedResolution;
    this.resolvedAt = data.resolvedAt;
    this.closedAt = data.closedAt;

    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TK-${timestamp}-${random}`.toUpperCase();
  }

  // Méthodes utilitaires
  get isOpen(): boolean {
    return this.status === 'open' || this.status === 'in_progress';
  }

  get isClosed(): boolean {
    return this.status === 'closed' || this.status === 'resolved';
  }

  get unreadMessagesCount(): number {
    return this.messages.filter(msg => !msg.seen).length;
  }

  get lastMessage(): TicketMessage | null {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  addMessage(message: TicketMessage): void {
    this.messages.push(message);
    this.lastActivity = new Date();
    this.updatedAt = new Date();
  }

  updateStatus(newStatus: TicketStatus): void {
    this.status = newStatus;
    this.updatedAt = new Date();

    if (newStatus === 'resolved') {
      this.resolvedAt = new Date();
    } else if (newStatus === 'closed') {
      this.closedAt = new Date();
    }
  }
}
