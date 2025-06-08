interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Image implements BaseDocument {
  _id?: string;
  title: string;
  url: string;
  description?: string;
  type: string;
  id_object: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Image>) {
    this.title = data.title || '';
    this.url = data.url || '';
    this.description = data.description;
    this.type = data.type || '';
    this.id_object = data.id_object || '';
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
