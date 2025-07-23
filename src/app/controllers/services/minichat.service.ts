import { Injectable } from '@angular/core';
import {Observable, Subject, BehaviorSubject, takeUntil, firstValueFrom} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { MiniChatMessage } from "../../models/MiniChatMessage.class";
import { ChatAttaschment } from "../../models/ChatAttaschment.class";
import {environment} from "../../../environments/environment";
import {AuthService} from "./auth.service";
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class MiniChatService {
  private socket: Socket | null = null;
  private messagesSubject = new Subject<MiniChatMessage>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private typingUsersSubject = new BehaviorSubject<{userId: string, userName: string}[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private errorSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  private readonly API_BASE = environment.baseUrl;
  private readonly API_BASE_SOCKET = environment.socketUrl;

  private currentPharmacyId: string | null = null;

  constructor(private apiService: ApiService, private http: HttpClient, private auth: AuthService) {}

  /**
   * Connexion au namespace admin via Socket.IO
   */
  connect(token: string): void {
    if (this.socket?.connected) { return; }

    this.socket = io(`${this.API_BASE_SOCKET}`, {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connecté');
      this.connectionStatusSubject.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket déconnecté:', reason);
      this.connectionStatusSubject.next(false);
    });

    // Écouter les nouveaux messages
    this.socket.on('new_message', (data: {message: any}) => {
      console.log('📩 Nouveau message reçu:', data);
      const message = new MiniChatMessage(data.message);
      this.messagesSubject.next(message);
      this.updateUnreadCount();
    });

    // Écouter les utilisateurs en train de taper
    this.socket.on('user_typing', (data: { userId: string, userName: string, pharmacyId: string, isTyping: boolean }) => {
      if (data.pharmacyId === this.currentPharmacyId) {
        const currentTyping = this.typingUsersSubject.value;
        if (data.isTyping) {
          const exists = currentTyping.find(u => u.userId === data.userId);
          if (!exists) {
            this.typingUsersSubject.next([...currentTyping, {userId: data.userId, userName: data.userName}]);
          }
        } else {
          this.typingUsersSubject.next(currentTyping.filter(u => u.userId !== data.userId));
        }
      }
    });

    // Écouter la confirmation de lecture
    this.socket.on('messages_read', (data: { pharmacyId: string, userId: string }) => {
      if (data.pharmacyId === this.currentPharmacyId) {
        this.unreadCountSubject.next(0);
      }
    });

    // Écouter les messages supprimés
    this.socket.on('message_deleted', (data: { messageId: string, pharmacyId: string, deletedBy: string }) => {
      // Vous pouvez émettre un événement pour mettre à jour l'interface
      console.log('🗑️ Message supprimé:', data);
    });

    // Écouter les erreurs
    this.socket.on('error', (error: {message: string}) => {
      console.error('❌ Erreur socket:', error);
      this.errorSubject.next(error.message);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket.IO:', error);
      this.errorSubject.next('Erreur de connexion au chat');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatusSubject.next(false);
      this.currentPharmacyId = null;
      this.typingUsersSubject.next([]);
    }
  }

  joinPharmacyChat(pharmacyId: string): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket non connecté, impossible de rejoindre le chat');
      return;
    }

    this.currentPharmacyId = pharmacyId;
    this.socket.emit('join_pharmacy_chat', { pharmacyId });
    console.log(`🏪 Tentative de rejoindre le chat de la pharmacie: ${pharmacyId}`);
  }

  leavePharmacyChat(pharmacyId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_pharmacy_chat', { pharmacyId });
      if (this.currentPharmacyId === pharmacyId) {
        this.currentPharmacyId = null;
      }
      this.typingUsersSubject.next([]);
    }
  }

  async getChatHistory(pharmacyId: string): Promise<MiniChatMessage[] | null> {
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token || !uid) return null;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const response: any = await firstValueFrom(
        this.apiService.post('chat/pharmacy/messages', { uid, pharmacyId }, headers)
      );

      if (response && !response.error && response.data) {
        return response.data.map((msg: any) => new MiniChatMessage(msg));
      } else {
        return [];
      }

    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'historique:', error);
      return null;
    }
  }

  sendMessage(pharmacyId: string, newMessage: MiniChatMessage): boolean {
    if (!this.socket?.connected) {
      console.error('❌ Socket non connecté, impossible d\'envoyer le message');
      this.errorSubject.next('Connexion au chat perdue');
      return false;
    }

    const payload = {
      pharmacyId: pharmacyId,
      message: {
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        senderType: newMessage.senderType,
        message: newMessage.message,
        attachments: newMessage.attachments || []
      }
    };

    console.log('📤 Envoi du message:', payload);
    this.socket.emit('send_message', payload);
    return true;
  }

  getMessages(): Observable<MiniChatMessage> {
    return this.messagesSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  getTypingUsers(): Observable<{userId: string, userName: string}[]> {
    return this.typingUsersSubject.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  getErrors(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  setTyping(pharmacyId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { pharmacyId, isTyping });
    }
  }

  markAsRead(pharmacyId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_as_read', { pharmacyId });
    }
  }

  /**
   * Upload de fichier
   */
  uploadFile(pharmacyId: string, file: File): Observable<ChatAttaschment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ChatAttaschment>(`${this.API_BASE}/chat/pharmacy/${pharmacyId}/upload`, formData);
  }

  /**
   * Récupérer les pharmacies avec messages non lus
   */
  getUnreadPharmacies(): Observable<{ pharmacyId: string, count: number }[]> {
    return this.http.get<{ pharmacyId: string, count: number }[]>(`${this.API_BASE}/chat/unread`);
  }

  /**
   * Rechercher dans l'historique des messages
   */
  searchMessages(pharmacyId: string, query: string): Observable<MiniChatMessage[]> {
    return this.http.get<MiniChatMessage[]>(`${this.API_BASE}/chat/pharmacy/${pharmacyId}/search`, {
      params: { q: query }
    });
  }

  /**
   * Supprimer un message (si autorisé)
   */
  deleteMessage(pharmacyId: string, messageId: string): Observable<void> {
    if (this.socket?.connected) {
      this.socket.emit('delete_message', { pharmacyId, messageId });
    }

    return this.http.delete<void>(`${this.API_BASE}/chat/pharmacy/${pharmacyId}/messages/${messageId}`);
  }

  /**
   * Mettre à jour le compteur de messages non lus
   */
  private updateUnreadCount(): void {
    if (this.currentPharmacyId) {
      const current = this.unreadCountSubject.value;
      this.unreadCountSubject.next(current + 1);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
