export class Location {
  latitude: number;
  longitude: number;

  constructor(data: { latitude: number; longitude: number }) {
    this.latitude = data.latitude;
    this.longitude = data.longitude;
  }
}
