import { Component, OnInit } from '@angular/core';
import {NotifyService, NotifyMessage} from "../../../../../controllers/services/notification.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-notify',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotifyComponent implements OnInit {
  messages: NotifyMessage[] = [];
  private counter = 0;

  constructor(private notify: NotifyService) {}

  ngOnInit() {
    this.notify.notify$.subscribe(msg => {
      if (msg && msg.message != '') { this.messages.push(msg); }
      this.playSound(msg.type);

      setTimeout(() => {
        this.messages = this.messages.filter(m => m !== msg);
      }, msg.duration || 3000);
    });
  }

  private playSound(type: string) {
    let file = '';
    switch (type) {
      case 'message_received': file = 'assets/sounds/notif_receive_message.wav'; break;
      case 'message_sent': file = 'assets/sounds/notif_send_message.wav'; break;
      case 'order_received': file = 'assets/sounds/notif_receive_order.wav'; break;
      case 'start_service': file = 'assets/sounds/notif_receive_2.wav'; break;
      case 'stop_service': file = 'assets/sounds/notif_receive_3.wav'; break;
      case 'receive': file = 'assets/sounds/notif_alert.wav'; break;
      default: file = 'assets/sounds/notif_send_message.wav'; break;
    }
    if (file) {
      const audio = new Audio(file);
      audio.play().catch(err => console.warn('Audio play blocked:', err));
    }
  }

}
