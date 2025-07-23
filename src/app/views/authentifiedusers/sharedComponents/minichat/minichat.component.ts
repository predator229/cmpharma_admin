import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectorRef
} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {PharmacyClass} from "../../../../models/Pharmacy.class";
import {UserDetails} from "../../../../models/UserDatails";
import {MiniChatMessage} from "../../../../models/MiniChatMessage.class";
import {D} from "@angular/cdk/keycodes";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../theme/shared/shared.module";
import {MiniChatService} from "../../../../controllers/services/minichat.service";
import {AuthService} from "../../../../controllers/services/auth.service";

interface AdminUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

@Component({
  selector: 'app-mini-chat',
  templateUrl: './minichat.component.html',
  imports: [
    ReactiveFormsModule,
    CommonModule, SharedModule
  ],
  styleUrls: ['./minichat.component.scss']
})
export class AdminChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() pharmacy!: PharmacyClass;
  @Input() currentUser!: UserDetails;
  @Input() userType: 'admin' | 'pharmacy' = 'pharmacy';

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  isChatOpen = false;
  isLoading = false;
  isConnected = false;
  isTyping = false;
  unreadCount = 0;
  typingUsers: {userId: string, userName: string}[] = [];
  errorMessage = '';

  messages: MiniChatMessage[] = [];
  allUsersInfos: AdminUser[] = [];
  messageForm: FormGroup;
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;
  private typingTimeout: any;

  constructor(
    private fb: FormBuilder,
    private chatService: MiniChatService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.messageForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  async ngOnInit() {
    this.isLoading = true;
    await this.connectToChat();
    this.loadOnlineAdmins();
    this.setupFormTypingIndicator();

  }

  async connectToChat() {
    try {
      const token = await this.authService.getRealToken();
      if (!token) {
        this.errorMessage = 'Token d\'authentification manquant';
        this.isLoading = false;
        return;
      }

      this.chatService.connect(token);

      // État de la connexion
      this.chatService.getConnectionStatus()
        .pipe(takeUntil(this.destroy$))
        .subscribe(async isConnected => {
          this.isConnected = isConnected;
          console.log(`🔗 État connexion: ${isConnected}`);

          if (isConnected && this.pharmacy?.id) {
            // Rejoindre la room de la pharmacie
            this.chatService.joinPharmacyChat(this.pharmacy.id);
            console.log(`✅ Rejoint le chat de la pharmacie ${this.pharmacy.id}`);

            // Charger l'historique des messages
            await this.loadChatHistory();
          }

          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });

      // Réception des nouveaux messages
      this.chatService.getMessages()
        .pipe(takeUntil(this.destroy$))
        .subscribe((message: MiniChatMessage) => {
          console.log('📩 Nouveau message reçu:', message);

          // Éviter les doublons
          const existingMessage = this.messages.find(m =>
            m.createdAt === message.createdAt &&
            m.senderId === message.senderId &&
            m.message === message.message
          );

          if (!existingMessage) {
            this.messages.push(message);

            // Incrémenter le compteur si le chat n'est pas ouvert et que ce n'est pas notre message
            if (message.senderId !== this.currentUser.id && !this.isChatOpen) {
              this.unreadCount++;
            }

            this.shouldScrollToBottom = true;
            this.changeDetectorRef.detectChanges();
          }
        });

      // Suivi des utilisateurs qui tapent
      this.chatService.getTypingUsers()
        .pipe(takeUntil(this.destroy$))
        .subscribe(typingUsers => {
          this.typingUsers = typingUsers.filter(user => user.userId !== this.currentUser.id);
          this.changeDetectorRef.detectChanges();
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

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.markAllAsRead();
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  loadOnlineAdmins() {
    this.allUsersInfos = [
      {
        id: 'admin1',
        name: 'Admin Support',
        avatar: 'assets/images/admin-avatar.png',
        isOnline: true
      },
      {
        id: 'admin2',
        name: 'Admin Validation',
        isOnline: false
      }
    ];
  }

  sendMessage() {
    if (this.messageForm.valid && this.messageForm.value.message.trim()) {
      const messageText = this.messageForm.value.message.trim();

      const newMessage: MiniChatMessage = {
        senderId: this.currentUser.id ?? '',
        senderName: this.currentUser.name ?? '',
        senderType: this.userType,
        message: messageText,
        for: this.pharmacy.id,
        isActivated:true,
        isDeleted:false,
        seen:false,
        deletedAt: null,
        seenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // this.messages.push(newMessage);
      this.messageForm.reset();

      // Envoyer le message via API
      this.chatService.sendMessage(this.pharmacy.id, newMessage);
      this.shouldScrollToBottom = true;

    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validation du fichier
      if (file.size > 10 * 1024 * 1024) { // 10MB max
        alert('Le fichier est trop volumineux (max 10MB)');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword'];
      if (!allowedTypes.includes(file.type)) {
        alert('Type de fichier non autorisé');
        return;
      }

      // Ici, vous uploaderiez le fichier et créeriez le message avec l'attachment
      console.log('Fichier sélectionné:', file);

      // Reset de l'input
      this.fileInput.nativeElement.value = '';
    }
  }

  markAllAsRead() {
    this.messages.forEach(message => {
      if (message.senderType === 'admin') {
        message.seen = true;
      }
    });
    this.unreadCount = 0;

    // Marquer comme lu côté serveur
    // this.chatService.markAsRead(this.pharmacyId);
  }

  scrollToBottom() {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Erreur lors du scroll:', err);
    }
  }

  formatMessageTime(timestamp: Date): string {
    const now = new Date();
    const messageDate = new Date(timestamp);

    if (now.toDateString() === messageDate.toDateString()) {
      return messageDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  getUserInfo(adminId: string): AdminUser | undefined {
    return this.allUsersInfos.find(admin => admin.id === adminId);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async loadChatHistory() {
    try {
      const history = await this.chatService.getChatHistory(this.pharmacy.id);
      if (history) {
        this.messages = history;
        this.shouldScrollToBottom = true;
        console.log(`📜 Historique chargé: ${history.length} messages`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'historique:', error);
    }
  }
  setupFormTypingIndicator() {
    this.messageForm.get('message')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value && value.trim() && this.isConnected) {
          if (!this.isTyping) {
            this.isTyping = true;
            this.chatService.setTyping(this.pharmacy.id, true);
          }

          // Reset du timeout
          clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.chatService.setTyping(this.pharmacy.id, false);
          }, 2000);
        }
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.pharmacy?.id) {
      this.chatService.leavePharmacyChat(this.pharmacy.id);
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

}
