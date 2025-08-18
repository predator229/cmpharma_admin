// nav-right.component.ts modifié

// Angular import
import {ChangeDetectorRef, Component, Input, OnInit, OnDestroy, Renderer2} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/controllers/services/auth.service';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import {UserDetails} from "../../../../../../models/UserDatails";
import {takeUntil} from "rxjs/operators";
import {MiniChatMessage} from "../../../../../../models/MiniChatMessage.class";
import {MiniChatService} from "../../../../../../controllers/services/minichat.service";
import {Subject} from "rxjs";
import {environment} from "../../../../../../../environments/environment";
import {Conversation} from "../../../../../../models/Conversation.class";
import {ActivityLoged} from "../../../../../../models/Activity.class";
import {Ticket} from "../../../../../../models/Ticket.class";
import {OrderClass} from "../../../../../../models/Order.class";
import {NotifyService} from "../../../../../../controllers/services/notification.service";

@Component({
  selector: 'app-nav-right',
  standalone: true,
  imports: [RouterModule, SharedModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent implements OnInit, OnDestroy {
  setFontFamily!: string;
  isLoading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();
  isChatOpen = false;
  isConnected = false;
  unreadCount = 0;
  internatPathUrl = environment.internalPathUrl;
  toShow = ['order','message', 'notif'];

  // Nouvelles propriétés pour le filtrage
  currentFilter = 'all';
  showStaticNotifications = false;
  toggleOrderSimulator = false;

  @Input() userDetails!: UserDetails;
  conversations: Conversation[] = [];
  orders: OrderClass[] = [];
  notifications: ActivityLoged[] = [];
  private shouldScrollToBottom = false;

  // Namespace spécifique pour les conversations/notifications
  private namespace = 'internal_messaging';

  constructor(
    private renderer: Renderer2,
    private authService: AuthService,
    private router: Router,
    private loadingService: LoadingService,
    private chatService: MiniChatService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  ngOnInit(): void {
    this.userDetails = this.userDetails ? this.userDetails : this.authService.getUserDetails();
    if (this.userDetails) {
      this.fontFamily(this.userDetails?.setups?.font_family ?? this.setFontFamily);
    }

    if (this.userDetails?.id) {
      this.connectToChat();
    }
  }

  ngOnDestroy(): void {
    console.log(`🧹 Nettoyage NavRight pour namespace: ${this.namespace}`);

    this.destroy$.next();
    this.destroy$.complete();

    // Déconnexion du namespace spécifique
    this.chatService.disconnectFromNamespace(this.namespace);
  }

  async connectToChat() {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const token = await this.authService.getRealToken();
      if (!token) {
        this.errorMessage = 'Token d\'authentification manquant';
        this.isLoading = false;
        return;
      }

      // Connexion au namespace spécifique pour les conversations
      this.chatService.connectToNamespace(this.namespace, token, this.userDetails.id);

      // État de la connexion pour ce namespace spécifique
      this.chatService.getConnectionStatusForNamespace(this.namespace)
        .pipe(takeUntil(this.destroy$))
        .subscribe(async isConnected => {
          this.isConnected = isConnected;
          console.log(`🔗 État connexion namespace ${this.namespace}: ${isConnected}`);

          if (isConnected && this.userDetails?.id) {
            await this.loadUnreadMessage();
          }

          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });

      // Écoute des nouvelles conversations avec filtrage par namespace
      this.chatService.getConversation()
        .pipe(takeUntil(this.destroy$))
        .subscribe((conversation: Conversation) => {
          // Filtrer pour ce namespace uniquement
          if (conversation.namespace === this.namespace) {
            const existingConv = this.conversations.find(conv => {
              return conv._id === conversation._id;
            });

            if (!existingConv) {
              this.conversations.unshift(conversation); // Ajouter en début de liste
              console.log(`💬 Nouvelle conversation reçue dans namespace ${this.namespace}:`, conversation);

              // Incrémenter le compteur si ce n'est pas l'utilisateur actuel
              if (conversation.participants.some(part => part._id !== this.userDetails.id) && !this.isChatOpen) {
                this.updateUnreadCount(1);
              }

              this.shouldScrollToBottom = true;
              this.changeDetectorRef.detectChanges();
            } else {
              // Mettre à jour la conversation existante
              const index = this.conversations.findIndex(conv => conv._id === conversation._id);
              if (index > -1) {
                this.conversations[index] = { ...this.conversations[index], ...conversation };
                this.changeDetectorRef.detectChanges();
              }
            }
          }
        });

      this.chatService.getOrders()
        .pipe(takeUntil(this.destroy$))
        .subscribe((order: OrderClass) => {
          const existingOrder = this.orders.find(ord => {
            return ord._id === order._id;
          });

          if (!existingOrder) {
            this.orders.unshift(order);

            this.updateUnreadCount(1);

            this.shouldScrollToBottom = true;
            this.changeDetectorRef.detectChanges();
          } else {
            // Mettre à jour la commande existante
            const index = this.orders.findIndex(ord => ord._id === order._id);
            if (index > -1) {
              this.orders[index] = new OrderClass(order);
              this.changeDetectorRef.detectChanges();
            }
          }
        });

      // Écoute des nouvelles activités avec filtrage par namespace
      this.chatService.getActivities()
        .pipe(takeUntil(this.destroy$))
        .subscribe((activity: ActivityLoged) => {
          // Filtrer pour ce namespace uniquement
          if (activity.namespace === this.namespace) {
            const existingActivity = this.notifications.find(notification => {
              return notification._id === activity._id;
            });

            if (!existingActivity) {
              this.notifications.unshift(activity); // Ajouter en début de liste
              console.log(`🔔 Nouvelle activité reçue dans namespace ${this.namespace}:`, activity);

              // Incrémenter le compteur si ce n'est pas l'utilisateur actuel
              if (activity.author !== this.userDetails.id && !this.isChatOpen) {
                this.updateUnreadCount(1);
              }

              this.shouldScrollToBottom = true;
              this.changeDetectorRef.detectChanges();
            }
          }
        });

      // Gestion des erreurs pour ce namespace
      this.chatService.getErrors()
        .pipe(takeUntil(this.destroy$))
        .subscribe(errorData => {
          if (errorData.namespace === this.namespace) {
            this.errorMessage = errorData.error;
            console.error(`❌ Erreur chat namespace ${this.namespace}:`, errorData.error);
          }
        });

      // Suivi du compteur de messages non lus pour ce namespace
      this.chatService.getUnreadCountForNamespace(this.namespace)
        .pipe(takeUntil(this.destroy$))
        .subscribe(count => {
          this.unreadCount = count;
          this.changeDetectorRef.detectChanges();
        });

    } catch (error) {
      console.error('❌ Erreur lors de la connexion au chat:', error);
      this.errorMessage = 'Erreur de connexion au chat';
      this.isLoading = false;
    }
  }

  // Méthode pour ouvrir/fermer le panneau de notifications
  toggleNotificationPanel() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.markAllAsRead();
    }
  }

  // Nouvelle méthode pour filtrer les éléments
  onFilterChange(event: any) {
    this.currentFilter = event.target.value;
    this.toShow = event.target.value === 'all' ? ['order', 'message', 'notif'] : [event.target.value];
    this.changeDetectorRef.detectChanges();
  }

  // Méthode pour obtenir les éléments filtrés
  getFilteredItems(type: 'message' | 'notif') {
    if (this.currentFilter === 'all') {
      return type === 'message' ? this.conversations : this.notifications;
    } else if (this.currentFilter === 'message' && type === 'message') {
      return this.conversations;
    } else if (this.currentFilter === 'notif' && type === 'notif') {
      return this.notifications;
    }
    return [];
  }

  // Méthode pour obtenir tous les éléments mélangés et triés par date
  getAllItemsSorted(): Array<{type: 'conversation' | 'notification', data: Conversation | ActivityLoged, date: Date}> {
    const allItems: Array<{type: 'conversation' | 'notification', data: Conversation | ActivityLoged, date: Date}> = [];

    // Ajouter les conversations
    this.getFilteredItems('message').forEach(conv => {
      allItems.push({
        type: 'conversation',
        data: conv,
        date: new Date(conv.updatedAt || conv.createdAt)
      });
    });

    // Ajouter les notifications
    this.getFilteredItems('notif').forEach(notif => {
      allItems.push({
        type: 'notification',
        data: notif,
        date: new Date(notif.createdAt)
      });
    });

    // Trier par date (plus récent en premier)
    return allItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getConversationTitle(conversation: Conversation): string {
    const otherParticipants = conversation.participants?.filter(p => p._id !== this.userDetails.id);
    if (otherParticipants?.length > 0) {
      return otherParticipants.map(p => p._id !== this.userDetails.id ? `${p.name} ${p.surname}` : '').join(', ');
    }
    return 'Conversation';
  }

  // Méthode pour formater le temps
  getTimeAgo(date: string | Date): string {
    const now = new Date();
    const itemDate = new Date(date);
    const diffMs = now.getTime() - itemDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;

    return itemDate.toLocaleDateString('fr-FR');
  }

  // Méthode pour déterminer si c'est une nouvelle conversation
  isNewConversation(conversation: Conversation): boolean {
    const now = new Date();
    const conversationDate = new Date(conversation.createdAt);
    const diffHours = (now.getTime() - conversationDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 24; // Nouvelle si créée dans les dernières 24h
  }

  // Méthode pour déterminer si c'est une nouvelle notification
  isNewNotification(notification: ActivityLoged): boolean {
    const now = new Date();
    const notificationDate = new Date(notification.createdAt);
    const diffHours = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 24; // Nouvelle si créée dans les dernières 24h
  }

  // Méthode pour déterminer si c'est une nouvelle commande
  isNewOrder(order: OrderClass): boolean {
    const now = new Date();
    const conversationDate = new Date(order.createdAt);
    const diffHours = (now.getTime() - conversationDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 1; // Nouvelle si créée dans les dernières 24h
  }

  // Méthode pour obtenir l'icône selon le type d'activité
  getActivityIcon(type: string): { icon: string, class: string } {
    switch (type) {
      case 'message':
        return { icon: 'ti ti-message-circle', class: 'bg-light-primary' };
      case 'document':
        return { icon: 'ti ti-file', class: 'bg-light-info' };
      case 'user':
        return { icon: 'ti ti-user', class: 'bg-light-success' };
      case 'system':
        return { icon: 'ti ti-settings', class: 'bg-light-warning' };
      case 'pharmacy':
        return { icon: 'ti ti-building-hospital', class: 'bg-light-success' };
      case 'validation':
        return { icon: 'ti ti-check-circle', class: 'bg-light-success' };
      case 'rejection':
        return { icon: 'ti ti-x-circle', class: 'bg-light-danger' };
      default:
        return { icon: 'ti ti-bell', class: 'bg-light-secondary' };
    }
  }

  markAllAsRead() {
    this.conversations.forEach(conv => {
      if (conv.unreadCount > 0) {
        conv.unreadCount = 0;
      }
    });

    this.unreadCount = 0;
    this.changeDetectorRef.detectChanges();
  }

  onConversationClick(conversation: Conversation) {
    console.log('📱 Clic sur conversation:', conversation);
  }

  onNotificationClick(notification: ActivityLoged) {
    console.log('🔔 Clic sur notification:', notification);
  }

  logout() {
    this.chatService.disconnectAll();
    this.authService.logout();
  }

  goToProfile() {
    this.router.navigate(['pharmacy/users', this.userDetails.id]);
  }

  fontFamily(font: string, sendToServer: boolean = false) {
    this.setFontFamily = font;
    this.renderer.removeClass(document.body, 'Roboto');
    this.renderer.removeClass(document.body, 'Poppins');
    this.renderer.removeClass(document.body, 'Inter');
    this.renderer.addClass(document.body, font);

    if (sendToServer) {
      this.loadingService.setLoading(true);
      this.authService.editSettingsUser(font)
        .then(() => {
          this.userDetails = this.authService.getUserDetails();
          this.loadingService.setLoading(false);
        })
        .catch(() => {
          this.loadingService.setLoading(false);
        });
    }
  }

  private async loadUnreadMessage() {
    try {
      const history = await this.chatService.getConvHistory(this.userDetails.id);
      if (history) {
        this.conversations = history.conversations || [];
        this.notifications = history.activities || [];

        let totalUnread = 0;
        this.conversations.forEach(conv => {
          if (conv.unreadCount > 0) {
            totalUnread += conv.unreadCount;
          }
        });

        this.unreadCount = totalUnread;
        this.shouldScrollToBottom = true;

        console.log(`📚 Historique chargé pour namespace ${this.namespace}:`, {
          conversations: this.conversations.length,
          notifications: this.notifications.length,
          unreadCount: this.unreadCount
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des conversations:', error);
    }
  }

  private updateUnreadCount(increment: number) {
    this.unreadCount = Math.max(0, this.unreadCount + increment);
  }

  // Méthodes de débogage
  isNamespaceConnected(): boolean {
    return this.chatService.isConnectedToNamespace(this.namespace);
  }

  logNamespaceInfo(): void {
    console.log('📊 Info namespace NavRight:', {
      namespace: this.namespace,
      isConnected: this.isNamespaceConnected(),
      currentUser: this.chatService.getCurrentPharmacyForNamespace(this.namespace),
      conversations: this.conversations.length,
      notifications: this.notifications.length,
      unreadCount: this.unreadCount,
      connectedNamespaces: this.chatService.getConnectedNamespaces()
    });
  }

  getRecentItemsCount(): number {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentConversations = this.conversations.filter(conv =>
      new Date(conv.createdAt) > oneDayAgo
    ).length;
    const recentNotifications = this.notifications.filter(notif =>
      new Date(notif.createdAt) > oneDayAgo
    ).length;

    return recentConversations + recentNotifications;
  }
  setChangeOrderStatus() {
    this.toggleOrderSimulator = !this.toggleOrderSimulator;
    this.chatService.changeOrderStatus(this.namespace, this.toggleOrderSimulator);
  }
}
