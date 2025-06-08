import { PharmacyClass } from "./Pharmacy.class";
import {Product} from "./Product";
import {Deliver} from "./Deliver.class";
import {Image} from "./Image.class";
import {Customer} from "./Custumer.class";

interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export class Order implements BaseDocument {
  _id?: string;
  id?: string;
  description?: string;
  totalAmount: number;
  stock: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid';
  deliveryStatus: 'pending' | 'on-the-way' | 'delivered';
  deliver_id?: string | Deliver;
  pharmacy_id?: string | PharmacyClass;
  products?: (string | Product)[];
  customer_id?: string | Customer;
  imageUrl?: string | Image;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Order>) {
    this.id = data.id;
    this.description = data.description;
    this.totalAmount = data.totalAmount || 0;
    this.stock = data.stock || 0;
    this.status = data.status || 'pending';
    this.paymentStatus = data.paymentStatus || 'unpaid';
    this.deliveryStatus = data.deliveryStatus || 'pending';
    this.deliver_id = data.deliver_id;
    this.pharmacy_id = data.pharmacy_id;
    this.products = data.products || [];
    this.customer_id = data.customer_id;
    this.imageUrl = data.imageUrl;
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
