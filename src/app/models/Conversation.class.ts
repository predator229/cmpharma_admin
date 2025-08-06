import {Admin} from "./Admin.class";
import {MiniChatMessage} from "./MiniChatMessage.class";

export class Conversation {
  _id: string;
  participants: Admin[];
  lastMessage?: MiniChatMessage;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  createdAt: Date;
  updatedAt: Date;
  namespace?: string;

  constructor(data: Partial<Conversation>) {
    this._id = data._id;
    this.participants = data.participants;
    this.lastMessage = data.lastMessage;
    this.unreadCount = data.unreadCount;
    this.isGroup = data.isGroup;
    this.groupName = data.groupName;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
