import { Product } from "./Product";

export class Order {
  id: string;
  customer: string;  // ID du client
  products: Product[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid';
  deliveryStatus: 'pending' | 'on-the-way' | 'delivered';
  deliveryPerson?: string;  // Optionnel, ID du livreur

  constructor(data: { id: string; customer: string; products: Product[]; totalAmount: number; status: 'pending' | 'completed' | 'cancelled'; paymentStatus: 'paid' | 'unpaid'; deliveryStatus: 'pending' | 'on-the-way' | 'delivered'; deliveryPerson?: string }) {
    this.id = data.id;
    this.customer = data.customer;
    this.products = data.products.map((p: Product) => new Product(p));
    this.totalAmount = data.totalAmount;
    this.status = data.status;
    this.paymentStatus = data.paymentStatus;
    this.deliveryStatus = data.deliveryStatus;
    this.deliveryPerson = data.deliveryPerson || '';
  }
}
