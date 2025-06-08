interface ApiCountry{
  _id: string;
  name: string;
  emoji: string;
  code:string;
  dial_code:string;
}
interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Country{
  id: string;
  name: string;
  emoji: string;
  code:string;
  dial_code:string;

    constructor(data: {
      id: string;
      name: string;
      emoji: string;
      code: string;
      dial_code: string;
    }) {
      this.id = data.id;
      this.name = data.name;
      this.emoji = data.emoji;
      this.dial_code = data.dial_code;
      this.code = data.code;
    }

    static fromApiResponse(data: ApiCountry): Country {
      return new Country({
        id: data._id,
        name: data.name,
        code: data.code,
        emoji: data.emoji,
        dial_code: data.dial_code,
      });
    }
}
