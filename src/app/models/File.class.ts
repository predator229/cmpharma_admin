
export class FileClass {
  _id?: String;
  originalName: String;
  fileName: String;
  fileType: String;
  fileSize: String;
  url?: String;
  extension?: String;
  uploadedBy: {
    name: String,
    email: String,
    _id: String
  };
  linkedTo: {
    model: String,
    objectId: String
  };
  tags: [String];
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
