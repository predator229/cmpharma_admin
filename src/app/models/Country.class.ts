interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export class Country implements BaseDocument {
  _id?: string;
  name: string;
  emoji: string;
  code: string;
  dial_code: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Country>) {
    this.name = data.name || '';
    this.emoji = data.emoji || '';
    this.code = data.code || '';
    this.dial_code = data.dial_code || '';
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
