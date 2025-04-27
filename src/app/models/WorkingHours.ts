export class WorkingHours {
  opening: string;
  closing: string;

  constructor(data: { opening: string; closing: string }) {
    this.opening = data.opening;
    this.closing = data.closing;
  }
}
