// ticket.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory
} from '../../models/Ticket.class';
import { TicketMessage } from 'src/app/models/TicketMessage.class';
import {TicketStats} from "../../models/TicketStats.class";
import {TicketTemplate} from "../../models/TicketTemplate.class";
import {FileClass} from "../../models/File.class";

interface TicketFilter {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string;
  pharmacy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private socket: Socket | null = null;
  private readonly namespace = 'ticketing';

  // Subjects pour les événements temps réel
  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  private currentTicketSubject = new BehaviorSubject<Ticket | null>(null);
  private allAtachementsSubject = new BehaviorSubject<FileClass[]>([]);
  private newMessageSubject = new Subject<TicketMessage>();
  private ticketUpdatedSubject = new Subject<Ticket>();
  private statsSubject = new BehaviorSubject<TicketStats>(new TicketStats());
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new Subject<string>();

  // Cache
  private ticketsCache: Map<string, Ticket> = new Map();
  private templatesCache: TicketTemplate[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  // Connexion WebSocket
  async connectToTicketSystem(): Promise<void> {
    try {
      const token = await this.authService.getRealToken();
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      this.socket = io(`${environment.socketUrl}/${this.namespace}`, {
        path: environment.pathWebsocket,
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.setupSocketEvents();
    } catch (error) {
      console.error('❌ Erreur connexion ticket system:', error);
      this.errorSubject.next('Erreur de connexion au système de tickets');
    }
  }

  private setupSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connecté au système de tickets');
      this.connectionStatusSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Déconnecté du système de tickets');
      this.connectionStatusSubject.next(false);
    });

    this.socket.on('ticket_created', (data: any) => {
      const ticket = new Ticket(data.ticket);
      this.ticketsCache.set(ticket._id!, ticket);
      this.updateTicketsSubject();
      console.log('🎫 Nouveau ticket créé:', ticket.ticketNumber);
    });

    this.socket.on('ticket_updated', (data: any) => {
      const ticket = new Ticket(data.ticket);
      this.ticketsCache.set(ticket._id!, ticket);
      this.updateTicketsSubject();
      this.ticketUpdatedSubject.next(ticket);
      console.log('🔄 Ticket mis à jour:', ticket.ticketNumber);
    });

    this.socket.on('new_message', (data: any) => {
      const message = new TicketMessage(data.message);
      this.newMessageSubject.next(message);

      // Mettre à jour le ticket en cache
      const ticket = this.ticketsCache.get(message._id);
      if (ticket) {
        ticket.addMessage(message);
        this.updateTicketsSubject();

        // Mettre à jour le ticket courant si c'est le même
        const currentTicket = this.currentTicketSubject.value;
        if (currentTicket && currentTicket._id === message._id) {
          this.currentTicketSubject.next(ticket);
        }
      }
      console.log('💬 Nouveau message reçu pour ticket:', message._id);
    });

    this.socket.on('message_read', (data: any) => {
      const { ticketId, messageId, readBy } = data;
      const ticket = this.ticketsCache.get(ticketId);
      if (ticket) {
        const message = ticket.messages.find(m => m._id === messageId);
        if (message) {
          message.markAsRead();
          this.updateTicketsSubject();
        }
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Erreur socket tickets:', error);
      this.errorSubject.next(error.message || 'Erreur inconnue');
    });
  }

  private updateTicketsSubject(): void {
    const tickets = Array.from(this.ticketsCache.values());
    this.ticketsSubject.next(tickets);
  }

  async getTickets( page: number = 1,  limit: number = 20,  filters?: TicketFilter): Promise<PaginatedResponse<Ticket>> {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();
      if (!token || !uid) throw new Error('Token manquant');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      // let params = new HttpParams()
      //   .set('page', page.toString())
      //   .set('limit', limit.toString());
      //
      // // Ajouter les filtres
      // if (filters) {
      //   if (filters.status?.length) {
      //     params = params.set('status', filters.status.join(','));
      //   }
      //   if (filters.priority?.length) {
      //     params = params.set('priority', filters.priority.join(','));
      //   }
      //   if (filters.category?.length) {
      //     params = params.set('category', filters.category.join(','));
      //   }
      //   if (filters.assignedTo) {
      //     params = params.set('assignedTo', filters.assignedTo);
      //   }
      //   if (filters.pharmacy) {
      //     params = params.set('pharmacy', filters.pharmacy);
      //   }
      //   if (filters.search) {
      //     params = params.set('search', filters.search);
      //   }
      //   if (filters.dateFrom) {
      //     params = params.set('dateFrom', filters.dateFrom.toISOString());
      //   }
      //   if (filters.dateTo) {
      //     params = params.set('dateTo', filters.dateTo.toISOString());
      //   }
      // }
      // params = params.set('uid', uid);

      let payload = {
        page,
        limit,
        uid,
        ...filters
      };
      const response: any = await firstValueFrom(
        this.apiService.post('tools/tickets/list', payload, headers)
      );

      if (response.success) {
        const tickets = response.data.tickets.map((t: any) => new Ticket(t));

        // Mettre à jour le cache
        tickets.forEach((ticket: Ticket) => {
          this.ticketsCache.set(ticket._id!, ticket);
        });

        this.updateTicketsSubject();

        return {
          data: tickets,
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages
        };
      }

      throw new Error(response.message || 'Erreur lors de la récupération des tickets');
    } catch (error) {
      console.error('❌ Erreur getTickets:', error);
      throw error;
    }
  }

  async getTicketById(ticketId: string): Promise<Ticket> {
    try {
      // Vérifier le cache d'abord
      const cachedTicket = this.ticketsCache.get(ticketId);
      if (cachedTicket) {
        this.currentTicketSubject.next(cachedTicket);
        return cachedTicket;
      }

      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();
      if (!token || !uid) throw new Error('Token manquant');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.apiService.post(`tools/tickets/listById`, {ticketId, uid}, headers)
      );

      if (response.success) {
        const ticket = new Ticket(response.data);
        this.ticketsCache.set(ticketId, ticket);
        this.allAtachementsSubject.next(response.allAtachements.map((a: any) => new FileClass(a)) ?? []);
        this.currentTicketSubject.next(ticket);
        return ticket;
      }

      throw new Error(response.message || 'Ticket non trouvé');
    } catch (error) {
      console.error('❌ Erreur getTicketById:', error);
      throw error;
    }
  }

  async createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();

      if (!token || !uid) throw new Error('Authentification manquante');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const payload = {
        ...ticketData,
        uid
      };

      const response: any = await firstValueFrom(
        this.apiService.post('tools/tickets/create', payload, headers)
      );

      if (response.success) {
        const ticket = new Ticket(response.data);
        this.ticketsCache.set(ticket._id!, ticket);
        this.updateTicketsSubject();
        return ticket;
      }

      throw new Error(response.message || 'Erreur lors de la création du ticket');
    } catch (error) {
      console.error('❌ Erreur createTicket:', error);
      throw error;
    }
  }

  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket> {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();
      if (!token || !uid) throw new Error('Token manquant');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response: any = await firstValueFrom(
        this.apiService.post(`tools/tickets/update`, {uid, ticketId, updates}, headers)
      );

      if (response.success) {
        const ticket = new Ticket(response.data);
        this.ticketsCache.set(ticketId, ticket);
        this.updateTicketsSubject();

        if (this.currentTicketSubject.value?._id === ticketId) {
          this.currentTicketSubject.next(ticket);
        }

        return ticket;
      }

      throw new Error(response.message || 'Erreur lors de la mise à jour du ticket');
    } catch (error) {
      console.error('❌ Erreur updateTicket:', error);
      throw error;
    }
  }

  async deleteTicket(ticketId: string): Promise<void> {
    try {
      const token = await this.authService.getRealToken();
      if (!token) throw new Error('Token manquant');

      const uid = await this.authService.getUid();
      if (!uid) throw new Error('Token manquant');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.apiService.post('tools/tickets/delete', {ticketId, uid}, headers)
      );

      if (response.success) {
        this.ticketsCache.delete(ticketId);
        this.updateTicketsSubject();

        if (this.currentTicketSubject.value?._id === ticketId) {
          this.currentTicketSubject.next(null);
        }
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression du ticket');
      }
    } catch (error) {
      console.error('❌ Erreur deleteTicket:', error);
      throw error;
    }
  }

  async sendMessage(ticketId: string, content: string, attachments: File[] = [], isInternal: boolean = false): Promise<TicketMessage> {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();

      if (!token || !uid) throw new Error('Authentification manquante');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const payload = {
        ticketId,
        content,
        isInternal,
        authorId: uid,
        uid
      };

      const response: any = await firstValueFrom(
        this.apiService.post('tools/tickets/sendMessage', payload, headers)
      );

      if (response.success) {
        const message = new TicketMessage(response.data);

        if (attachments){
          for (const attachment of attachments) {
            const file = await this.uploadAttachment(attachment, message._id, 'message');
            if (file !== null) { message.attachments.push(file); }
          }
        }

        // Émettre via WebSocket si connecté
        if (this.socket?.connected) {
          this.socket.emit('send_message', {
            ticketId,
            message: message
          });
        }

        return message;
      }

      throw new Error(response.message || 'Erreur lors de l\'envoi du message');
    } catch (error) {
      console.error('❌ Erreur sendMessage:', error);
      throw error;
    }
  }

  async markMessageAsRead(ticketId: string, messageId: string): Promise<void> {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();
      if (!token || !uid) throw new Error('Token ou uid manquant');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const payload = { ticketId, messageId, uid };

      const response: any = await firstValueFrom(
        this.apiService.post('tools/tickets/messages/read', payload, headers)
      );

      if (response.success && this.socket?.connected) {
        this.socket.emit('mark_message_read', {
          ticketId,
          messageId
        });
      }
    } catch (error) {
      console.error('❌ Erreur markMessageAsRead:', error);
    }
  }

  async getTicketTemplates(): Promise<TicketTemplate[]> {
    try {
      if (this.templatesCache.length > 0) {
        return this.templatesCache;
      }

      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();
      if (!token || !uid) throw new Error('Token ou uid manquant');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.apiService.post('tools/tickets/templates',{uid}, headers)
      );

      if (response.success) {
        this.templatesCache = response.data.map((t: any) => new TicketTemplate(t));
        return this.templatesCache;
      }

      throw new Error(response.message || 'Erreur lors de la récupération des templates');
    } catch (error) {
      console.error('❌ Erreur getTicketTemplates:', error);
      throw error;
    }
  }

  async getTicketStats(): Promise<TicketStats> {
    try {
      const token = await this.authService.getRealToken();
      if (!token) throw new Error('Token manquant');

      const uid = await this.authService.getUid();
      if (!uid) throw new Error('uid manquant');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.apiService.post('tools/tickets/stats', {uid}, headers)
      );

      if (response.success) {
        const stats = new TicketStats(response.data);
        this.statsSubject.next(stats);
        return stats;
      }

      throw new Error(response.message || 'Erreur lors de la récupération des statistiques');
    } catch (error) {
      console.error('❌ Erreur getTicketStats:', error);
      throw error;
    }
  }

  async uploadAttachment(file: File, ticketId: string, type:string = 'ticket'): Promise<FileClass | null> {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();

      if (!token || !uid) throw new Error('Authentification manquante');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type_', 'ticket_attachment');
      formData.append(type == 'ticket' ? 'ticketId' : 'ticketMessageId', ticketId);
      formData.append('uid', uid);

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.apiService.post(`tools/tickets/upload${type != 'ticket' ? '-message' : ''}`, formData, headers)
      );

      if (response.success) {
        return new FileClass(response.data);
      }

      throw new Error(response.message || 'Erreur lors de l\'upload');
    } catch (error) {
      console.error('❌ Erreur uploadAttachment:', error);
      throw error;
      return null;
    }
  }

  getTickets$(): Observable<Ticket[]> {
    return this.ticketsSubject.asObservable();
  }

  getCurrentTicket$(): Observable<Ticket | null> {
    return this.currentTicketSubject.asObservable();
  }

  getAllAtachements$(): Observable<FileClass[]> {
    return this.allAtachementsSubject.asObservable();
  }

  getNewMessages$(): Observable<TicketMessage> {
    return this.newMessageSubject.asObservable();
  }

  getTicketUpdates$(): Observable<Ticket> {
    return this.ticketUpdatedSubject.asObservable();
  }

  getStats$(): Observable<TicketStats> {
    return this.statsSubject.asObservable();
  }

  getConnectionStatus$(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  getErrors$(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  isConnected(): boolean {
    return this.connectionStatusSubject.value;
  }

  getCurrentTicket(): Ticket | null {
    return this.currentTicketSubject.value;
  }

  clearCurrentTicket(): void {
    this.currentTicketSubject.next(null);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.ticketsCache.clear();
    this.templatesCache = [];
    this.connectionStatusSubject.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
