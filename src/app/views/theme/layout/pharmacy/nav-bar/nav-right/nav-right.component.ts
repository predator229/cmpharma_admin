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
  previewDoc: string;
  unreadCount = 0;
  internatPathUrl = environment.internalPathUrl;

  // Nouvelles propriétés pour le filtrage
  currentFilter = 'all';
  showStaticNotifications = false; // Pour masquer/afficher les notifications statiques

  @Input() userDetails!: UserDetails;
  conversations: Conversation[] = [];
  notifications: ActivityLoged[] = [];
  private shouldScrollToBottom = false;

  constructor(
    private renderer: Renderer2,
    private authService: AuthService,
    private router: Router,
    private loadingService: LoadingService,
    private chatService: MiniChatService,
    private changeDetectorRef: ChangeDetectorRef
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
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.disconnect();
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

      this.chatService.connect(token, this.userDetails.id, 'conversation');

      // État de la connexion
      this.chatService.getConnectionStatus()
        .pipe(takeUntil(this.destroy$))
        .subscribe(async isConnected => {
          this.isConnected = isConnected;
          console.log(`🔗 État connexion: ${isConnected}`);

          if (isConnected && this.userDetails?.id) {
            await this.loadUnreadMessage();
          }

          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });

      // Écoute des nouvelles conversations
      this.chatService.getConversation()
        .pipe(takeUntil(this.destroy$))
        .subscribe((conversation: Conversation) => {
          const existingConv = this.conversations.find(conv => {
            return conv._id === conversation._id;
          });

          if (!existingConv) {
            this.conversations.push(conversation);

            if (conversation.participants.some(part => part._id !== this.userDetails.id) && !this.isChatOpen) {
              this.unreadCount++;
            }

            this.shouldScrollToBottom = true;
            this.changeDetectorRef.detectChanges();
          }
        });

      // Écoute des nouvelles activités
      this.chatService.getActivities()
        .pipe(takeUntil(this.destroy$))
        .subscribe((activity: ActivityLoged) => {
          const existingActivity = this.notifications.find(notification => {
            return notification._id === activity._id;
          });

          if (!existingActivity) {
            this.notifications.push(activity);

            if (activity.author !== this.userDetails.id && !this.isChatOpen) {
              this.unreadCount++;
            }

            this.shouldScrollToBottom = true;
            this.changeDetectorRef.detectChanges();
          }
        });

      // Gestion des erreurs
      this.chatService.getErrors()
        .pipe(takeUntil(this.destroy$))
        .subscribe(error => {
          this.errorMessage = error;
          console.error('❌ Erreur chat:', error);
        });

      // Suivi du compteur de messages non lus
      this.chatService.getUnreadCount()
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

  // Nouvelle méthode pour filtrer les éléments
  onFilterChange(event: any) {
    this.currentFilter = event.target.value;
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

  getConversationTitle(conversation: Conversation): string {
    const otherParticipants = conversation.participants.filter(p => p._id !== this.userDetails.id);
    if (otherParticipants.length > 0) {
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
      default:
        return { icon: 'ti ti-bell', class: 'bg-light-secondary' };
    }
  }

  // Méthode pour marquer toutes les notifications comme lues
  markAllAsRead() {
    // Marquer les conversations comme lues
    this.conversations.forEach(conv => {
      if (conv.unreadCount > 0) {
        conv.unreadCount = 0;
      }
    });

    this.unreadCount = 0;
    this.changeDetectorRef.detectChanges();
  }

  logout() {
    this.chatService.disconnect();
    this.authService.logout();
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
        this.conversations = history.conversations;
        this.notifications = history.activities;
        this.shouldScrollToBottom = true;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    }
  }
}
