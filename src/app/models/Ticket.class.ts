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

// // TicketMessage.class.ts
// export class TicketMessage {
//   _id?: string;
//   content: string;
//
//   author: Admin;
//
//   attachments: FileClass[];
//
//   // Métadonnées
//   isInternal: boolean; // Message visible uniquement par les admins
//   seen: boolean;
//   seenAt?: Date;
//   editedAt?: Date;
//
//   // Timestamps
//   createdAt: Date;
//   updatedAt: Date;
//
//   constructor(data: Partial<TicketMessage>) {
//     this._id = data._id;
//     this.content = data.content || '';
//     this.author = data.author;
//     this.attachments = data.attachments?.map(att => new FileClass(att)) || [];
//
//     this.isInternal = data.isInternal || false;
//     this.seen = data.seen || false;
//     this.seenAt = data.seenAt;
//     this.editedAt = data.editedAt;
//
//     this.createdAt = data.createdAt || new Date();
//     this.updatedAt = data.updatedAt || new Date();
//   }
//
//   markAsRead(): void {
//     this.seen = true;
//     this.seenAt = new Date();
//   }
//
//   edit(newContent: string): void {
//     this.content = newContent;
//     this.editedAt = new Date();
//     this.updatedAt = new Date();
//   }
// }

// // TicketTemplate.class.ts
// export class TicketTemplate {
//   _id?: string;
//   name: string;
//   category: TicketCategory;
//   title: string;
//   description: string;
//   priority: TicketPriority;
//   tags: string[];
//   isActive: boolean;
//
//   createdBy: Admin;
//
//   createdAt: Date;
//   updatedAt: Date;
//
//   constructor(data: Partial<TicketTemplate>) {
//     this._id = data._id;
//     this.name = data.name || '';
//     this.category = data.category || 'general';
//     this.title = data.title || '';
//     this.description = data.description || '';
//     this.priority = data.priority || 'medium';
//     this.tags = data.tags || [];
//     this.isActive = data.isActive !== false;
//
//     this.createdBy = data.createdBy;
//
//     this.createdAt = data.createdAt || new Date();
//     this.updatedAt = data.updatedAt || new Date();
//   }
// }
//
// // TicketStats.class.ts
// export class TicketStats {
//   total: number;
//   open: number;
//   inProgress: number;
//   resolved: number;
//   closed: number;
//   pending: number;
//
//   byPriority: {
//     low: number;
//     medium: number;
//     high: number;
//     urgent: number;
//   };
//
//   byCategory: {
//     technical: number;
//     billing: number;
//     account: number;
//     feature_request: number;
//     bug_report: number;
//     general: number;
//   };
//
//   averageResolutionTime: number; // en heures
//   totalUnread: number;
//
//   constructor(data: Partial<TicketStats> = {}) {
//     this.total = data.total || 0;
//     this.open = data.open || 0;
//     this.inProgress = data.inProgress || 0;
//     this.resolved = data.resolved || 0;
//     this.closed = data.closed || 0;
//     this.pending = data.pending || 0;
//
//     this.byPriority = {
//       low: data.byPriority?.low || 0,
//       medium: data.byPriority?.medium || 0,
//       high: data.byPriority?.high || 0,
//       urgent: data.byPriority?.urgent || 0
//     };
//
//     this.byCategory = {
//       technical: data.byCategory?.technical || 0,
//       billing: data.byCategory?.billing || 0,
//       account: data.byCategory?.account || 0,
//       feature_request: data.byCategory?.feature_request || 0,
//       bug_report: data.byCategory?.bug_report || 0,
//       general: data.byCategory?.general || 0
//     };
//
//     this.averageResolutionTime = data.averageResolutionTime || 0;
//     this.totalUnread = data.totalUnread || 0;
//   }
// }
