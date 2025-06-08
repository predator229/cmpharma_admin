interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Mobil implements BaseDocument {
  _id?: string;
  digits: string;
  indicatif: string;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Mobil>) {
    this.digits = data.digits || '';
    this.indicatif = data.indicatif || '';
    this.title = data.title;
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
