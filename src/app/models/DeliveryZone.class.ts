import {ZoneCoordinates} from "./ZoneCoordinates.class";

export class DeliveryZoneClass {
  _id?: string;
  type: 'zone'| 'city'| 'radius';
  coordinates : ZoneCoordinates;
  radius?: number | null;
  isActive: boolean;
  maxSelectionArea: number;

  constructor(data: Partial<DeliveryZoneClass>) {
    this._id = data._id;
    this.type = data.type;
    this.coordinates = data.coordinates;
    this.radius = data.radius ? ( data.radius >= 1 && data.radius <= 50 ? data.radius : 20 ) : 0;
    this.isActive = data.isActive;
    this.maxSelectionArea = data.maxSelectionArea ?? 1000;
  }
}
