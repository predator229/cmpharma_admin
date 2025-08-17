import { Injectable } from '@angular/core';
import {Observable, Subject, BehaviorSubject, takeUntil, firstValueFrom} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { MiniChatMessage } from "../../models/MiniChatMessage.class";
import { ChatAttaschment } from "../../models/ChatAttaschment.class";
import {environment} from "../../../environments/environment";
import {AuthService} from "./auth.service";
import {ApiService} from "./api.service";
import {Conversation} from "../../models/Conversation.class";
import {ActivityLoged} from "../../models/Activity.class";
import {OrderClass} from "../../models/Order.class";

interface SocketData {
  socket: Socket;
  iD: string | null;
  isConnected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MiniChatService {
  // Map pour stocker les sockets par namespace
  private sockets: Map<string, SocketData> = new Map();

  // Subjects pour les événements
  private messagesSubject = new Subject<MiniChatMessage>();
  private conversationsSubject = new Subject<Conversation>();
  private notificationsSubject = new Subject<ActivityLoged>();
  private ordersSubject = new Subject<OrderClass>();
  private connectionStatusSubject = new BehaviorSubject<Map<string, boolean>>(new Map());
  private typingUsersSubject = new Subject<{namespace: string, isTyping: boolean}>();
  private unreadCountSubject = new BehaviorSubject<Map<string, number>>(new Map());
  private errorSubject = new Subject<{namespace: string, error: string}>();
  private destroy$ = new Subject<void>();

  private readonly API_BASE = environment.baseUrl;
  private readonly API_BASE_SOCKET = environment.socketUrl;
  private currentUserId: string | null = null;

  constructor(private apiService: ApiService, private http: HttpClient, private auth: AuthService) {
    this.currentUserId = this.auth.getUid();
  }

  /**
   * Connecte à un namespace spécifique
   */
  connectToNamespace(namespace: string, token: string, iD?: string): void {
    // Vérifier si déjà connecté à ce namespace
    const existingSocket = this.sockets.get(namespace);
    if (existingSocket && existingSocket.isConnected) {
      console.log(`✅ Déjà connecté au namespace: ${namespace}`);
      return;
    }

    console.log(`🔌 Connexion au namespace: ${namespace}`);

    // Créer une nouvelle connexion socket
    const socket = io(`${this.API_BASE_SOCKET}/${namespace}`, {
      path: environment.pathWebsocket,
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Stocker les données du socket
    const socketData: SocketData = {
      socket,
      iD: null,
      isConnected: false
    };

    this.sockets.set(namespace, socketData);
    this.setupSocketEvents(namespace, socketData, iD);
  }

  /**
   * Configure les événements pour un socket spécifique
   */
  private setupSocketEvents(namespace: string, socketData: SocketData, iD?: string): void {
    const { socket } = socketData;

    socket.on('connect', () => {
      console.log(`✅ Socket connecté au namespace: ${namespace}`);
      socketData.isConnected = true;
      this.updateConnectionStatus(namespace, true);

      // Auto-join si iD fourni
      if (iD) {
        this.joinPharmacyChat(namespace, iD);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket déconnecté du namespace ${namespace}:`, reason);
      socketData.isConnected = false;
      socketData.iD = null;
      this.updateConnectionStatus(namespace, false);
      this.updateTypingStatus(namespace, false);
    });

    socket.on('you are connected', () => {
      console.log(`📡 Confirmation de connexion pour namespace: ${namespace}`);
      if (iD) {
        this.joinPharmacyChat(namespace, iD);
      }
    });

    socket.on('join', (data: { iD: string, roomName: string, timestamp: Date }) => {
      console.log(`✅ Rejoint avec succès la conversation dans ${namespace}:`, data);
      socketData.iD = data.iD;
    });

    socket.on('left_pharmacy_chat', (data: { iD: string, timestamp: Date }) => {
      console.log(`👋 Quitté la conversation dans ${namespace}:`, data);
      if (socketData.iD === data.iD) {
        socketData.iD = null;
      }
    });

    // Écouter les nouveaux messages
    socket.on('new_message', (data: {message: any, iD: string}) => {
      console.log(`📩 Nouveau message reçu dans ${namespace}:`, data);
      const message = new MiniChatMessage(data.message);
      message.namespace = namespace; // Ajouter l'info du namespace
      this.messagesSubject.next(message);

      if (data.iD === socketData.iD) {
        if (message.senderId !== this.currentUserId) {
          this.updateUnreadCount(namespace, 1);
        }
      }
    });

    socket.on('new_conv_message', (data: {conversation: any, userID: string}) => {
      const conversation = new Conversation(data.conversation);
      conversation.namespace = namespace; // Ajouter l'info du namespace
      this.conversationsSubject.next(conversation);

      if (data.userID === socketData.iD) {
        if (conversation.participants.some(part => part._id == this.currentUserId)) {
          this.updateUnreadCount(namespace, 1);
        }
      }
    });
    socket.on('new_order', (data: {order: any}) => {
      const order = new OrderClass(data.order);
      this.ordersSubject.next(order);
      this.updateUnreadCount(namespace, 1);
    });

    socket.on('new_order', (data: {order: any}) => {
      const order = new OrderClass(data.order);
      this.ordersSubject.next(order);
      this.updateUnreadCount(namespace, 1);
    });

    socket.on('new_notification', (data: {notification: any, userID: string}) => {
      console.log(`📩 Nouvelle notification reçue dans ${namespace}:`, data);
      const notif = new ActivityLoged(data.notification);
      notif.namespace = namespace; // Ajouter l'info du namespace
      this.notificationsSubject.next(notif);

      if (data.userID === socketData.iD) {
        if (notif.author == this.currentUserId) {
          this.updateUnreadCount(namespace, 1);
        }
      }
    });

    socket.on('user_joined', (data: { userId: string, userName: string, userType: string, iD: string, timestamp: Date }) => {
      console.log(`👤 Utilisateur rejoint dans ${namespace}:`, data);
    });

    socket.on('user_left', (data: { userId: string, userName: string, userType: string, iD: string, timestamp: Date }) => {
      console.log(`👋 Utilisateur parti dans ${namespace}:`, data);
    });

    socket.on('messages_read', (data: { iD: string, userId: string, readCount: number }) => {
      console.log(`✅ Messages marqués comme lus dans ${namespace}:`, data);
      if (data.iD === socketData.iD) {
        this.setUnreadCount(namespace, 0);
      }
    });

    socket.on('marked_as_read', (data: { iD: string, readCount: number }) => {
      console.log(`✅ Confirmation marquage comme lu dans ${namespace}:`, data);
    });

    socket.on('message_deleted', (data: { messageId: string, iD: string, deletedBy: string }) => {
      console.log(`🗑️ Message supprimé dans ${namespace}:`, data);
    });

    socket.on('message_deleted_confirm', (data: { messageId: string, iD: string }) => {
      console.log(`✅ Confirmation suppression message dans ${namespace}:`, data);
    });

    socket.on('message_sent', (data: { messageId: string, timestamp: Date }) => {
      console.log(`✅ Message envoyé avec succès dans ${namespace}:`, data);
    });

    socket.on('error', (error: {message: string}) => {
      console.error(`❌ Erreur socket dans ${namespace}:`, error);
      this.errorSubject.next({namespace, error: error.message});
    });

    socket.on('connect_error', (error) => {
      console.error(`❌ Erreur de connexion Socket.IO dans ${namespace}:`, error);
      this.errorSubject.next({namespace, error: 'Erreur de connexion au chat'});
    });

    // Timeout de connexion
    setTimeout(() => {
      if (!socket.connected) {
        console.error(`❌ Timeout de connexion socket pour ${namespace}`);
        this.errorSubject.next({namespace, error: 'Timeout de connexion au chat'});
      }
    }, 10000);
  }

  /**
   * Déconnecte d'un namespace spécifique
   */
  disconnectFromNamespace(namespace: string): void {
    const socketData = this.sockets.get(namespace);
    if (!socketData) {
      console.warn(`⚠️ Aucun socket trouvé pour le namespace: ${namespace}`);
      return;
    }

    const { socket } = socketData;
    if (socket.connected) {
      console.log(`🔌 Déconnexion du namespace: ${namespace}`);

      // Quitter la conversation en cours si nécessaire
      if (socketData.iD) {
        this.leavePharmacyChat(namespace, socketData.iD);
      }

      socket.disconnect();
    }

    // Nettoyer les données
    this.sockets.delete(namespace);
    this.updateConnectionStatus(namespace, false);
    this.updateTypingStatus(namespace, false);
  }

  /**
   * Déconnecte tous les sockets
   */
  disconnectAll(): void {
    console.log('🔌 Déconnexion de tous les namespaces...');

    this.sockets.forEach((socketData, namespace) => {
      this.disconnectFromNamespace(namespace);
    });

    // Reset des subjects
    this.connectionStatusSubject.next(new Map());
    this.unreadCountSubject.next(new Map());
    this.currentUserId = null;
  }

  /**
   * Rejoint le chat d'une pharmacie dans un namespace
   */
  joinPharmacyChat(namespace: string, iD: string): boolean {
    const socketData = this.sockets.get(namespace);
    if (!socketData || !socketData.isConnected) {
      console.error(`❌ Socket non connecté pour le namespace: ${namespace}`);
      this.errorSubject.next({namespace, error: 'Connexion au chat perdue'});
      return false;
    }

    if (!iD) {
      console.error(`❌ iD manquant pour le namespace: ${namespace}`);
      this.errorSubject.next({namespace, error: 'ID de pharmacie manquant'});
      return false;
    }

    const payload = { iD };
    console.log(`🏥 Rejoindre pharmacie ${iD} dans namespace ${namespace}`);

    socketData.socket.emit('je_rejoins_la_phamacie_conv', payload);
    return true;
  }

  /**
   * Quitte le chat d'une pharmacie dans un namespace
   */
  leavePharmacyChat(namespace: string, iD: string): void {
    const socketData = this.sockets.get(namespace);
    if (!socketData || !socketData.isConnected) {
      console.warn(`⚠️ Socket non connecté pour le namespace: ${namespace}`);
      return;
    }

    if (iD) {
      console.log(`👋 Quitter le chat de la pharmacie ${iD} dans namespace ${namespace}`);
      socketData.socket.emit('leave_pharmacy_chat', { iD });

      if (socketData.iD === iD) {
        socketData.iD = null;
      }
      this.updateTypingStatus(namespace, false);
    }
  }

  /**
   * Demmarrer/stopper le simulateur de commande
   */
  changeOrderStatus(namespace: string, start: boolean): void {
    const socketData = this.sockets.get(namespace);
    if (socketData?.isConnected) {
      console.log(`${start ? 'Demmarage' : 'stoppage'} du simulateur de commande pour ${namespace}`);
      socketData.socket.emit('toggle_simulator', { start });
    }
  }
  /**
   * Envoie un message dans un namespace spécifique
   */
  sendMessage(namespace: string, iD: string, newMessage: MiniChatMessage, attachments: string[]): boolean {
    const socketData = this.sockets.get(namespace);
    if (!socketData || !socketData.isConnected) {
      console.error(`❌ Socket non connecté pour le namespace: ${namespace}`);
      this.errorSubject.next({namespace, error: 'Connexion au chat perdue'});
      return false;
    }

    if (!iD) {
      console.error(`❌ iD manquant pour le namespace: ${namespace}`);
      this.errorSubject.next({namespace, error: 'ID de pharmacie manquant'});
      return false;
    }

    const payload: any = {
      iD,
      message: newMessage,
      attachments: attachments
    };

    console.log(`📤 Envoi message dans ${namespace}:`, payload);
    socketData.socket.emit('send_message', payload);
    return true;
  }

  /**
   * Marque les messages comme lus dans un namespace
   */
  markAsRead(namespace: string, iD: string): void {
    const socketData = this.sockets.get(namespace);
    if (socketData?.isConnected && iD) {
      console.log(`✅ Marquage comme lu pour pharmacie ${iD} dans namespace ${namespace}`);
      socketData.socket.emit('mark_as_read', { iD });
    }
  }

  // Méthodes pour récupérer l'historique (inchangées)
  async getChatHistory(iD: string): Promise<MiniChatMessage[] | null> {
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

      console.log('📜 Récupération de l\'historique pour:', iD);

      const response: any = await firstValueFrom(
        this.apiService.post('chat/pharmacy/messages', { uid, iD }, headers)
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

  async getConvHistory(userID: string): Promise<any | null> {
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

      console.log('📜 Récupération des dernières conversations et notifications pour:', userID);

      const response: any = await firstValueFrom(
        this.apiService.post('chat/pharmacy/messages/conversation', { uid, userID, limit: 5 }, headers)
      );

      if (response && !response.error && response.data && response.activities) {
        return {
          conversations: response.data.map((conv: any) => new Conversation(conv)),
          activities: response.activities.map((log: any) => new ActivityLoged(log)),
        };
      } else {
        console.log('📭 Aucune conversation trouvée');
        return {
          conversations: [],
          activities: [],
        };
      }

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des dernières conversation et notifications:', error);
      return {
        conversations: [],
        activities: [],
      };
    }
  }

  // Méthodes utilitaires privées
  private updateConnectionStatus(namespace: string, isConnected: boolean): void {
    const currentStatus = this.connectionStatusSubject.value;
    const newStatus = new Map(currentStatus);
    newStatus.set(namespace, isConnected);
    this.connectionStatusSubject.next(newStatus);
  }

  private updateTypingStatus(namespace: string, isTyping: boolean): void {
    this.typingUsersSubject.next({ namespace, isTyping });
  }

  private updateUnreadCount(namespace: string, increment: number): void {
    const currentCounts = this.unreadCountSubject.value;
    const newCounts = new Map(currentCounts);
    const currentCount = newCounts.get(namespace) || 0;
    newCounts.set(namespace, currentCount + increment);
    this.unreadCountSubject.next(newCounts);
  }

  private setUnreadCount(namespace: string, count: number): void {
    const currentCounts = this.unreadCountSubject.value;
    const newCounts = new Map(currentCounts);
    newCounts.set(namespace, count);
    this.unreadCountSubject.next(newCounts);
  }

  // Observables publics
  getMessages(): Observable<MiniChatMessage> {
    return this.messagesSubject.asObservable();
  }

  getConversation(): Observable<Conversation> {
    return this.conversationsSubject.asObservable();
  }
  getOrders(): Observable<OrderClass> {
    return this.ordersSubject.asObservable();
  }

  getActivities(): Observable<ActivityLoged> {
    return this.notificationsSubject.asObservable();
  }

  getConnectionStatus(): Observable<Map<string, boolean>> {
    return this.connectionStatusSubject.asObservable();
  }

  getConnectionStatusForNamespace(namespace: string): Observable<boolean> {
    return new Observable(observer => {
      this.connectionStatusSubject.subscribe(statusMap => {
        observer.next(statusMap.get(namespace) || false);
      });
    });
  }

  getUnreadCount(): Observable<Map<string, number>> {
    return this.unreadCountSubject.asObservable();
  }

  getUnreadCountForNamespace(namespace: string): Observable<number> {
    return new Observable(observer => {
      this.unreadCountSubject.subscribe(countMap => {
        observer.next(countMap.get(namespace) || 0);
      });
    });
  }

  getErrors(): Observable<{namespace: string, error: string}> {
    return this.errorSubject.asObservable();
  }

  getTypingUsers(): Observable<{namespace: string, isTyping: boolean}> {
    return this.typingUsersSubject.asObservable();
  }

  // Méthodes utilitaires publiques
  isConnectedToNamespace(namespace: string): boolean {
    const socketData = this.sockets.get(namespace);
    return socketData?.isConnected || false;
  }

  getConnectedNamespaces(): string[] {
    const connected: string[] = [];
    this.sockets.forEach((socketData, namespace) => {
      if (socketData.isConnected) {
        connected.push(namespace);
      }
    });
    return connected;
  }

  getCurrentPharmacyForNamespace(namespace: string): string | null {
    const socketData = this.sockets.get(namespace);
    return socketData?.iD || null;
  }

  ngOnDestroy(): void {
    console.log('🧹 Nettoyage du service MiniChat');
    this.disconnectAll();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
