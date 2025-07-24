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
  private typingUsersSubject = new Subject<boolean>();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private errorSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  private readonly API_BASE = environment.baseUrl;
  private readonly API_BASE_SOCKET = environment.socketUrl;

  private currentPharmacyId: string | null = null;
  private currentUserId: string | null = null; // AJOUT: pour identifier l'utilisateur actuel

  constructor(private apiService: ApiService, private http: HttpClient, private auth: AuthService) {}

  /**
   * Connexion au namespace admin via Socket.IO
   */
  connect(token: string, pharmacyId:string): void {
    if (this.socket?.connected) {
      console.log('⚠️ Socket déjà connecté');
      return;
    }

    console.log('🔄 Tentative de connexion au socket...', `${this.API_BASE_SOCKET}/admin/websocket`);

    // CORRECTION 1: Connexion au bon namespace
    this.socket = io(`${this.API_BASE_SOCKET}`, {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    this.currentUserId = this.auth.getUid();

    this.socket.on('connect', async () => {
      console.log('✅ Socket connecté au namespace admin');
      this.connectionStatusSubject.next(true);
    });

    this.socket.on('you are connected', () => {
      console.log('heheheheheheh');
      this.join(pharmacyId);
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket déconnecté:', reason);
      this.connectionStatusSubject.next(false);
      this.currentPharmacyId = null;
      this.typingUsersSubject.next(false);
    });

    // CORRECTION 2: Ajouter l'écoute de la confirmation de join
    this.socket.on('join', (data: { pharmacyId: string, roomName: string, timestamp: Date }) => {
      console.log('✅ Rejoint avec succès la conversation:', data);
      this.currentPharmacyId = data.pharmacyId;
    });

    this.socket.on('left_pharmacy_chat', (data: { pharmacyId: string, timestamp: Date }) => {
      console.log('👋 Quitté la conversation:', data);
      if (this.currentPharmacyId === data.pharmacyId) {
        this.currentPharmacyId = null;
      }
    });

    // Écouter les nouveaux messages
    this.socket.on('new_message', (data: {message: any, pharmacyId: string}) => {
      console.log('📩 Nouveau message reçu:', data);
      const message = new MiniChatMessage(data.message);
      this.messagesSubject.next(message);
      if (data.pharmacyId === this.currentPharmacyId) {
        if (message.senderId !== this.currentUserId) {
          this.updateUnreadCount();
        }
      }
    });

    // Écouter les utilisateurs en train de taper
    this.socket.on('user_typing', (data: { userId: string, userName: string, pharmacyId: string, isTyping: boolean, userType: string }) => {
      console.log('⌨️ Utilisateur en train de taper:', data);

      // if (data.pharmacyId === this.currentPharmacyId && data.userType !== 'admin') {
      //   const currentTyping = this.typingUsersSubject.value;
      //   if (data.isTyping) {
      //     const exists = currentTyping.find(u => u.userId === data.userId);
      //     if (!exists) {
            this.typingUsersSubject.next(true);
      //     }
      //   } else {
      //     this.typingUsersSubject.next(currentTyping.filter(u => u.userId !== data.userId));
      //   }
      // }
    });

    this.socket.on('user_joined', (data: { userId: string, userName: string, userType: string, pharmacyId: string, timestamp: Date }) => {
      console.log('👤 Utilisateur rejoint:', data);
    });

    this.socket.on('user_left', (data: { userId: string, userName: string, userType: string, pharmacyId: string, timestamp: Date }) => {
      console.log('👋 Utilisateur parti:', data);
    });

    this.socket.on('messages_read', (data: { pharmacyId: string, userId: string, readCount: number }) => {
      console.log('✅ Messages marqués comme lus:', data);
      if (data.pharmacyId === this.currentPharmacyId) {
        this.unreadCountSubject.next(0);
      }
    });

    this.socket.on('marked_as_read', (data: { pharmacyId: string, readCount: number }) => {
      console.log('✅ Confirmation marquage comme lu:', data);
    });

    this.socket.on('message_deleted', (data: { messageId: string, pharmacyId: string, deletedBy: string }) => {
      console.log('🗑️ Message supprimé:', data);
      // Émettre un événement pour mettre à jour l'interface
    });

    this.socket.on('message_deleted_confirm', (data: { messageId: string, pharmacyId: string }) => {
      console.log('✅ Confirmation suppression message:', data);
    });

    this.socket.on('message_sent', (data: { messageId: string, timestamp: Date }) => {
      console.log('✅ Message envoyé avec succès:', data);
    });

    this.socket.on('error', (error: {message: string}) => {
      console.error('❌ Erreur socket:', error);
      this.errorSubject.next(error.message);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket.IO:', error);
      this.errorSubject.next('Erreur de connexion au chat');
    });

    setTimeout(() => {
      if (!this.socket?.connected) {
        console.error('❌ Timeout de connexion socket');
        this.errorSubject.next('Timeout de connexion au chat');
      }
    }, 10000);
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Déconnexion du socket...');

      if (this.currentPharmacyId) {
        this.leavePharmacyChat(this.currentPharmacyId);
      }

      this.socket.disconnect();
      this.socket = null;
      this.connectionStatusSubject.next(false);
      this.currentPharmacyId = null;
      this.currentUserId = null;
      this.typingUsersSubject.next(false);
    }
  }

  leavePharmacyChat(pharmacyId: string): void {
    if (this.socket?.connected && pharmacyId) {
      console.log(`👋 Quitter le chat de la pharmacie: ${pharmacyId}`);
      this.socket.emit('leave_pharmacy_chat', { pharmacyId });

      if (this.currentPharmacyId === pharmacyId) {
        this.currentPharmacyId = null;
      }
      this.typingUsersSubject.next(false);
    }
  }

  async getChatHistory(pharmacyId: string): Promise<MiniChatMessage[] | null> {
    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token || !uid) {
        console.error('❌ Token ou UID manquant');
        return null;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      console.log('📜 Récupération de l\'historique pour:', pharmacyId);

      const response: any = await firstValueFrom(
        this.apiService.post('chat/pharmacy/messages', { uid, pharmacyId }, headers)
      );

      if (response && !response.error && response.data) {
        console.log(`✅ ${response.data.length} messages récupérés`);
        return response.data.map((msg: any) => new MiniChatMessage(msg));
      } else {
        console.log('📭 Aucun message trouvé');
        return [];
      }

    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'historique:', error);
      return null;
    }
  }

  sendMessage(pharmacyId: string, newMessage: MiniChatMessage, attachments: string | null): boolean {
    if (!this.socket?.connected) {
      console.error('❌ Socket non connecté, impossible d\'envoyer le message');
      this.errorSubject.next('Connexion au chat perdue');
      return false;
    }

    if (!pharmacyId) {
      console.error('❌ pharmacyId manquant pour l\'envoi du message');
      this.errorSubject.next('ID de pharmacie manquant');
      return false;
    }


    const payload =
      attachments != null ?
      {
        pharmacyId: pharmacyId,
        message: newMessage,
        attachments: attachments
      } :
       {
        pharmacyId: pharmacyId,
        message: newMessage
      };
    console.log(payload)
    this.socket.emit('send_message', payload);
    return true;
  }

  join(pharmacyId: string): boolean {
    if (!this.socket?.connected) {
      console.error('❌ Socket non connecté, impossible de se connecter');
      this.errorSubject.next('Connexion au chat perdue');
      return false;
    }

    if (!pharmacyId) {
      console.error('❌ pharmacyId manquant pour la connection');
      this.errorSubject.next('ID de pharmacie manquant');
      return false;
    }

    const payload = {
      pharmacyId: pharmacyId,
    };

    this.socket.emit('je_rejoins_la_phamacie_conv', payload);
    return true;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentPharmacyId(): string | null {
    return this.currentPharmacyId;
  }

  // Observables
  getMessages(){
    return this.messagesSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  getTypingUsers(): Observable<boolean> {
    return this.typingUsersSubject.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  getErrors(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  setTyping(pharmacyId: string, isTyping: boolean, userType: string): void {
    if (this.socket?.connected && pharmacyId) {
      this.socket.emit('typing', { pharmacyId, isTyping, userType });
    }
  }

  markAsRead(pharmacyId: string): void {
    if (this.socket?.connected && pharmacyId) {
      console.log('✅ Marquage comme lu pour:', pharmacyId);
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
      console.log('🗑️ Suppression du message:', messageId);
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
    console.log('🧹 Nettoyage du service MiniChat');
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
