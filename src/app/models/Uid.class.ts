interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Uid implements BaseDocument {
  _id?: string;
  uid: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Uid>) {
    this.uid = data.uid || '';
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
