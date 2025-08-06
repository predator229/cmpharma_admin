import {Admin} from "./Admin.class";
import {FileClass} from "./File.class";

export class TicketMessage {
  _id?: string;
  content: string;

  author: Admin;

  attachments: FileClass[];

  // Métadonnées
  isInternal: boolean; // Message visible uniquement par les admins
  seen: boolean;
  seenAt?: Date;
  editedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<TicketMessage>) {
    this._id = data._id;
    this.content = data.content || '';
    this.author = data.author;
    this.attachments = data.attachments?.map(att => new FileClass(att)) || [];

    this.isInternal = data.isInternal || false;
    this.seen = data.seen || false;
    this.seenAt = data.seenAt;
    this.editedAt = data.editedAt;

    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  markAsRead(): void {
    this.seen = true;
    this.seenAt = new Date();
  }

  edit(newContent: string): void {
    this.content = newContent;
    this.editedAt = new Date();
    this.updatedAt = new Date();
  }
}
