import {Location} from "./Location";

export class ZoneCoordinates {
  _id?: string;
  points: Location[];

  constructor(data: Partial<ZoneCoordinates>) {
    this._id = data._id;
    this.points = data.points;
  }
}
