// TypeScript - OpeningHoursClass mise à jour
interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OpeningHoursClass implements BaseDocument {
  _id?: string;
  open: boolean;
  opening: string;
  closing: string;
  day: number; // 1 = Lundi, 2 = Mardi, ..., 7 = Dimanche
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<OpeningHoursClass>) {
    this.open = data.open !== undefined ? data.open : true;
    this.opening = data.opening || '09:00';
    this.closing = data.closing || '18:00';
    this.day = this.validateDay(data.day || 1);
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  private validateDay(day: number): number {
    if (day < 1 || day > 7) {
      throw new Error('Day must be between 1 and 7 (1=Monday, 7=Sunday)');
    }
    return day;
  }

  getDayName(): string {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[this.day - 1];
  }
}
