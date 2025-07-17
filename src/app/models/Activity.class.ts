export class ActivityLoged {
  _id: string;
  type: string;
  id_object: string;
  title:string;
  description: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  time?: string;

  constructor(data: Partial<ActivityLoged>) {
    this._id = data._id;
    this.type = data.type;
    this.id_object = data.id_object;
    this.title = data.title;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.author = data.author;
    this.time = data.time;
  }
}
