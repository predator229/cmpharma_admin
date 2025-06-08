import {Category} from "./Category.class";
import {Image} from "./Image.class";
import {PharmacyClass} from "./Pharmacy.class";

interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product implements BaseDocument {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string | Category;
  pharmacy_id?: string | PharmacyClass;
  main_img_url?: string | Image;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Product>) {
    this.id = data.id;
    this.name = data.name || '';
    this.description = data.description;
    this.price = data.price || 0;
    this.stock = data.stock || 0;
    this.category = data.category;
    this.pharmacy_id = data.pharmacy_id;
    this.main_img_url = data.main_img_url;
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
