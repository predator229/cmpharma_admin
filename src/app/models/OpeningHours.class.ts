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
  day: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<OpeningHoursClass>) {
    if (!data || !data.day || !this.validateDay(data.day) ) { return;}

    this.open = data.open !== undefined ? data.open : true;
    this.opening = data.opening || '09:00';
    this.closing = data.closing || '18:00';
    this.day = data.day;
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  private validateDay(day: number): number {
    if (day < 1 || day > 7) {
      console.log("damie");
      console.log(day);
      throw new Error('Day must be between 1 and 7 (1=Monday, 7=Sunday)');
    }
    return day;
  }

  getDayName(): string {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[this.day - 1];
  }
}
