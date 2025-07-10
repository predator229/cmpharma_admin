interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export class Location implements BaseDocument {
  _id?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Location>) {
    this.latitude = data.latitude || 0.0;
    this.longitude = data.longitude || 0.0;
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
