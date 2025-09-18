import {Admin} from "./Admin.class";
import {HistoryInfo} from "./BonFiscal.class";

export interface InvoiceNote {
  note: string;
  createdAt: Date;
  updatedAt: Date;
  from: Admin;
}

export class InvoiceClass {
  _id?: string;

  invoiceNumber: string;
  invoiceNotes: InvoiceNote[];

  generations: HistoryInfo[];

  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;
    this.invoiceNumber = data.invoiceNumber;

    this.invoiceNotes = data.invoiceNotes || [];
    this.generations = data.generations || [];

    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }
}
