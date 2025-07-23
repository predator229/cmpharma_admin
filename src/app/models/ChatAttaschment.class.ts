export class ChatAttaschment {
  _id?: string;
  name: string;
  url: string;
  type: 'image' | 'document';
  size: number;
  isActivated: boolean;
  isDeleted: boolean;
  deletedAt: Date| null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<ChatAttaschment>) {
    this._id = data._id;
    this.name = data.name;
    this.url = data.url;
    this.type = data.type;
    this.size = data.size;
    this.isActivated = data.isActivated || false;
    this.isDeleted = data.isDeleted || false;
    this.deletedAt = data.deletedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
