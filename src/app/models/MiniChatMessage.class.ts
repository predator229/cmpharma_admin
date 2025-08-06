import {FileClass} from "./File.class";

export class MiniChatMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  senderType: 'admin' | 'pharmacy';
  message: string;
  for?: string;
  conversation? : string;
  attachments?: FileClass[];
  isActivated:boolean;
  isDeleted: boolean;
  seen: boolean;
  seenAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  showMoreInfo? : boolean;
  isGroup?: boolean;
  namespace?: string;

  constructor(data: Partial<MiniChatMessage>) {
    this._id = data._id;
    this.senderId = data.senderId;
    this.senderName = data.senderName;
    this.senderType = data.senderType;
    this.message = data.message;
    this.for = data.for;
    this.conversation = data.conversation ?? null;
    this.attachments = data.attachments || [];
    this.isActivated = data.isActivated || false;
    this.isDeleted = data.isDeleted || false;
    this.deletedAt = data.deletedAt;
    this.seen = data.seen || false;
    this.seenAt = data.seenAt || null;
    this.deletedAt = data.deletedAt;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.showMoreInfo = data.showMoreInfo || false;
    this.isGroup = data.isGroup || false;
  }
}
