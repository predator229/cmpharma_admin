import { Order } from "./Order";
import { Product } from "./Product";
import { WorkingHours } from "./WorkingHours";
import { Location } from "./Location";

export class Pharmacy {
  id: string;
  name: string;
  ownerId: string;  // Correspond à l'id de l'utilisateur admin ou propriétaire
  location: Location;
  products: Product[];
  workingHours: WorkingHours;
  orders: Order[];
  totalRevenue: number;

  constructor(data: { id: string; name: string; ownerId: string; location_latitude: number; location_longitude:number, products: Product[]; workingHours: WorkingHours; orders: Order[]; totalRevenue: number }) {
    this.id = data.id;
    this.name = data.name;
    this.ownerId = data.ownerId;
    this.location = new Location({latitude :data.location_latitude, longitude: data.location_longitude});
    this.products = data.products.map((p: Product) => new Product(p));
    this.workingHours = new WorkingHours(data.workingHours);
    this.orders = data.orders.map((o: Order) => new Order(o));
    this.totalRevenue = data.totalRevenue;
  }
}
