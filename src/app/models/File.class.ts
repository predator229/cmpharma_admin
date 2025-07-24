
export class FileClass {
  _id?: string;
  originalName: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  url?: string;
  extension?: string;
  uploadedBy: {
    name: string,
    email: string,
    _id: string
  };
  linkedTo: {
    model: string,
    objectId: string
  };
  tags: [string];
  isPrivate: Boolean;
  expiresAt: Date;
  meta: {
    width: Number,
    height: Number,
    pages: Number
  };
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: any) {
    this._id = data._id;
    this.originalName = data.originalName || '';
    this.fileName = data.fileName || '';
    this.fileType = data.fileType || '';
    this.fileSize = data.fileSize || '';
    this.url = data.url;
    this.extension = data.extension;
    this.uploadedBy = {
      name: data.uploadedBy?.name || '',
      email: data.uploadedBy?.email || '',
      _id: data.uploadedBy?._id || ''
    };
    this.linkedTo = {
      model: data.linkedTo?.model || '',
      objectId: data.linkedTo?.objectId || ''
    };
    this.tags = data.tags || [];
    this.isPrivate = data.isPrivate || false;
    this.expiresAt = data.expiresAt;
    this.meta = {
      width: data.meta?.width || 0,
      height: data.meta?.height || 0,
      pages: data.meta?.pages || 0
    };
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
