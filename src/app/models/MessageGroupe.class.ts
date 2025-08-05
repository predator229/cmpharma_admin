import {MiniChatMessage} from "./MiniChatMessage.class";

export class MessageGroup {
  date: string;
  messages: MiniChatMessage[];

  constructor(data: Partial<MessageGroup>) {
    this.date = data.date;
    this.messages = data.messages;
  }
}
