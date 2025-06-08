import { OpeningHoursClass } from "./OpeningHours.class";

interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkingHours implements BaseDocument {
  _id?: string;
  day?: string | OpeningHoursClass;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<WorkingHours>) {
    this.day = data.day;
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
