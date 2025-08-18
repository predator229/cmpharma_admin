import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type NotifyType = 'success' | 'error' | 'info' | 'warning' | 'order_received' | 'message_received' | 'message_sent' | 'start_service' | 'stop_service' | 'receive';

export interface NotifyMessage {
  id: number;
  type: NotifyType;
  message: string;
  duration?: number; // ms
}

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private counter = 0;

  private notifySubject = new Subject<NotifyMessage>();
  notify$ = this.notifySubject.asObservable();

  show(type: NotifyType, message: string, duration = 3000) {
    const id = ++this.counter;
    this.notifySubject.next({ id, type, message, duration });
  }

  success(message: string, duration = 3000) {
    this.show('success', message, duration);
  }

  error(message: string, duration = 3000) {
    this.show('error', message, duration);
  }

  info(message: string, duration = 3000) {
    this.show('info', message, duration);
  }

  warning(message: string, duration = 3000) {
    this.show('warning', message, duration);
  }

  custom(message: string, type: NotifyType = 'success', duration = 3000) {
    this.show(type, message, duration);
  }
}
