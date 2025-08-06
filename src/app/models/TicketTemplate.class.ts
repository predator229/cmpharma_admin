import {Admin} from "./Admin.class";
import {TicketCategory, TicketPriority} from "./Ticket.class";

export class TicketTemplate {
  _id?: string;
  name: string;
  category: TicketCategory;
  title: string;
  description: string;
  priority: TicketPriority;
  tags: string[];
  isActive: boolean;

  createdBy: Admin;

  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<TicketTemplate>) {
    this._id = data._id;
    this.name = data.name || '';
    this.category = data.category || 'general';
    this.title = data.title || '';
    this.description = data.description || '';
    this.priority = data.priority || 'medium';
    this.tags = data.tags || [];
    this.isActive = data.isActive !== false;

    this.createdBy = data.createdBy;

    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}
