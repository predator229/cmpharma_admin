export class Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;

  constructor(data: { id: string; name: string; category: string; price: number; stock: number }) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.price = data.price;
    this.stock = data.stock;
  }
}
