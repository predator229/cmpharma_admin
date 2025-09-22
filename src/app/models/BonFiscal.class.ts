import {Admin} from "./Admin.class";

export interface BonFiscaleNote {
  note: string;
  createdAt: Date;
  updatedAt: Date;
  from: Admin;
}
export interface HistoryInfo {
  generatedBy: Admin;
  generatedAt: Date;
}

export class BonFiscalClass {
  _id?: string;
  bonfiscalNumber: string;

  pdfData?: Buffer;
  htmlData?: string;

  bonfiscalNotes: BonFiscaleNote[];
  generations: HistoryInfo[];

  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id;
    this.bonfiscalNumber = data.bonfiscalNumber;

    this.pdfData = data.pdfData ?? null;
    this.htmlData = data.htmlData ?? null;

    this.bonfiscalNotes = data.bonfiscalNotes || [];
    this.generations = data.generations || [];
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }
}
