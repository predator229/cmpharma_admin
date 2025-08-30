import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectorRef
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../theme/shared/shared.module';

import { Admin } from '../../../../../models/Admin.class';
import { MiniChatMessage } from '../../../../../models/MiniChatMessage.class';
import { Conversation } from '../../../../../models/Conversation.class';
import { FileClass } from '../../../../../models/File.class';
import { AuthService } from '../../../../../controllers/services/auth.service';
import { ApiService } from '../../../../../controllers/services/api.service';
import { MiniChatService } from '../../../../../controllers/services/minichat.service';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import {ActivatedRoute, Router} from "@angular/router";
import {UserDetails} from "../../../../../models/UserDatails";
import {NotifyService} from "../../../../../controllers/services/notification.service";

interface MessageGroup {
  date: string;
  messages: MiniChatMessage[];
}

@Component({
  selector: 'app-internal-messaging',
  templateUrl: './messagerie.component.html',
  styleUrls: ['./messagerie.component.scss'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    SharedModule
  ]
})
export class PharmacyInternalMessagingComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;

  // État principal
  userDetail: UserDetails;
  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  messages: MiniChatMessage[] = [];
  groupedMessages: MessageGroup[] = [];

  // Utilisateurs et contacts
  allAdmins: Admin[] = [];
  onlineUsers: Set<string> = new Set();
  selectedUsers: Admin[] = [];
  filteredAdmins: Admin[] = [];

  // Interface
  isLoading = false;
  isConnected = false;
  showNewConversation = false;
  showUserList = false;
  searchQuery = '';
  filteredConversations: Conversation[] = [];
  errorMessage = '';
  successMessage = '';

  // Messages
  messageForm: FormGroup;
  searchForm: FormGroup;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  isTyping = false;
  typingUsers: Set<string> = new Set();
  unreadCount = 0;

  // Configuration
  internatPathUrl = environment.internalPathUrl;
  maxFileSize = 10 * 1024 * 1024; // 10MB
  maxFiles = 5;
  allowedFileTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  // Namespace pour le chat interne
  private namespace = 'internal_messaging';
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;
  private typingTimeout: any;
  private connectionRetryCount = 0;
  private maxRetryAttempts = 5;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private chatService: MiniChatService,
    private changeDetectorRef: ChangeDetectorRef,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notifyService: NotifyService
  ) {
    this.messageForm = this.fb.group({
      message: ['', [Validators.maxLength(2000)]]
    });

    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  async ngOnInit() {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();

        if (loaded && this.userDetail) {
          await this.initializeComponent();
        }
      });
  }

  private async initializeComponent() {
    this.isLoading = true;
    this.clearMessages();

    try {
      await this.loadAllAdmins();
      await this.connectToMessaging();
      await this.loadConversations();
      this.setupSearch();
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.showError('Erreur lors de l\'initialisation de la messagerie');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAllAdmins() {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();

      if (!token || !uid) {
        throw new Error('Token ou UID manquant');
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await this.apiService.post(
        'pharmacy-management/users/list',
        { uid },
        headers
      ).toPromise();

      if (response && !response.error && response.data?.users) {
        this.allAdmins = response.data.users
          .filter((admin: any) => admin._id !== this.userDetail.id)
          .map((admin: any) => new Admin(admin))
          .sort((a: Admin, b: Admin) => a.getFullName().localeCompare(b.getFullName()));

        this.filteredAdmins = [...this.allAdmins];
        console.log(`✅ ${this.allAdmins.length} administrateurs chargés`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement administrateurs:', error);
      throw error;
    }
  }

  private async connectToMessaging() {
    try {
      const token = await this.authService.getRealToken();
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Connexion au namespace de messagerie interne
      this.chatService.connectToNamespace(this.namespace, token);

      // Écouter l'état de connexion
      this.chatService.getConnectionStatusForNamespace(this.namespace)
        .pipe(takeUntil(this.destroy$))
        .subscribe(isConnected => {
          this.isConnected = isConnected;
          this.connectionRetryCount = isConnected ? 0 : this.connectionRetryCount + 1;

          if (isConnected) {
            console.log('✅ Connecté au système de messagerie');
            this.showSuccess('Connecté au système de messagerie');
          } else {
            console.log('❌ Déconnecté du système de messagerie');
            this.handleDisconnection();
          }

          this.changeDetectorRef.detectChanges();
        });

      // Écouter les nouveaux messages
      this.chatService.getMessages()
        .pipe(takeUntil(this.destroy$))
        .subscribe((message: MiniChatMessage) => {
          if (message.namespace === this.namespace) {
            this.handleNewMessage(message);
          }
        });

      // Écouter les nouvelles conversations
      this.chatService.getConversation()
        .pipe(takeUntil(this.destroy$))
        .subscribe((conversation: Conversation) => {
          if (conversation.namespace === this.namespace) {
            this.handleNewConversation(conversation);
          }
        });

      // Écouter les erreurs
      this.chatService.getErrors()
        .pipe(takeUntil(this.destroy$))
        .subscribe(errorData => {
          if (errorData.namespace === this.namespace) {
            console.error('❌ Erreur chat:', errorData.error);
            this.showError(errorData.error);
          }
        });

    } catch (error) {
      console.error('❌ Erreur connexion messagerie:', error);
      this.showError('Erreur de connexion à la messagerie');
    }
  }

  private async loadConversations() {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();

      if (!token || !uid) {
        throw new Error('Token ou UID manquant');
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await this.apiService.post(
        'chat/pharmacy/messages/conversation',
        { uid, userID: this.userDetail.id },
        headers
      ).toPromise();

      if (response && response.success && response.data) {
        this.conversations = response.data.map((conv: any) => new Conversation({
          _id: conv._id,
          participants: conv.participants?.map((p: any) => new Admin(p)) || [],
          lastMessage: conv.lastMessage ? new MiniChatMessage(conv.lastMessage) : undefined,
          unreadCount: conv.unreadCount || 0,
          isGroup: conv.isGroup || false,
          groupName: conv.groupName,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt)
        }));

        // Trier par dernière activité
        this.conversations.sort((a, b) => {
          const dateA = a.lastMessage?.createdAt || a.updatedAt;
          const dateB = b.lastMessage?.createdAt || b.updatedAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        this.filteredConversations = [...this.conversations];

        // Calculer le nombre total de messages non lus
        this.unreadCount = this.conversations.reduce((total, conv) => total + conv.unreadCount, 0);

        // Sélectionner la première conversation si aucune n'est active
        if (this.conversations.length > 0 && !this.activeConversation) {
          await this.selectConversation(this.conversations[0]);
        }

        console.log(`✅ ${this.conversations.length} conversations chargées`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error);
      this.showError('Erreur lors du chargement des conversations');
    }
  }

  private setupSearch() {
    // Recherche dans les conversations
    this.searchForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.filterConversations(query);
      });
  }

  async selectConversation(conversation: Conversation) {
    if (this.activeConversation?._id === conversation._id) return;

    this.activeConversation = conversation;
    this.messages = [];
    this.groupedMessages = [];
    this.clearMessages();

    // Marquer la conversation comme lue
    if (conversation.unreadCount > 0) {
      conversation.unreadCount = 0;
      this.updateUnreadCount();
      await this.markConversationAsRead(conversation._id);
    }

    await this.loadMessages(conversation._id);
    this.shouldScrollToBottom = true;
  }

  private async loadMessages(conversationId: string) {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await this.apiService.post(
        'chat/pharmacy/messages/conversation/loadMessage',
        { uid, conversationId },
        headers
      ).toPromise();

      if (response && response.success && response.data) {
        this.messages = response.data.map((msg: any) => new MiniChatMessage({
          ...msg,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt)
        }));

        this.groupMessagesByDate();
        this.shouldScrollToBottom = true;
        console.log(`✅ ${this.messages.length} messages chargés pour la conversation`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
      this.showError('Erreur lors du chargement des messages');
    }
  }

  private groupMessagesByDate() {
    if (!this.messages.length) {
      this.groupedMessages = [];
      return;
    }

    const groups: { [key: string]: MiniChatMessage[] } = {};

    this.messages.forEach(message => {
      const dateKey = new Date(message.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    this.groupedMessages = Object.keys(groups)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => ({
        date: this.formatDateGroup(new Date(date)),
        messages: groups[date]
      }));
  }

  async createNewConversation() {
    if (this.selectedUsers.length === 0) {
      this.showError('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const participantIds = [this.userDetail.id, ...this.selectedUsers.map(user => user._id)];
      const isGroup = this.selectedUsers.length > 1;

      const body = {
        createConversation: true,
        uid,
        participants: participantIds,
        isGroup,
        groupName: isGroup ? `Groupe ${this.selectedUsers.map(u => u.getFullName()).join(', ')}` : undefined
      };

      const response: any = await this.apiService.post(
        'chat/pharmacy/messages/conversation/create',
        body,
        headers
      ).toPromise();

      if (response && response.success && response.data) {
        const newConversation = new Conversation({
          _id: response.data._id,
          participants: [new Admin(this.userDetail), ...this.selectedUsers],
          unreadCount: 0,
          isGroup,
          groupName: body.groupName,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        this.conversations.unshift(newConversation);
        this.filteredConversations = [...this.conversations];

        await this.selectConversation(newConversation);
        this.closeNewConversation();
        this.showSuccess('Nouvelle conversation créée avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      this.showError('Erreur lors de la création de la conversation');
    }
  }

  // === GESTION DES MESSAGES ===

  async sendMessage() {
    const messageText = this.messageForm.get('message')?.value?.trim();

    if (!this.activeConversation) {
      this.showError('Aucune conversation sélectionnée');
      return;
    }

    if (!messageText && this.selectedFiles.length === 0) {
      return;
    }

    try {
      let attachments = [];
      if (this.selectedFiles) {
        try {
          attachments = await this.uploadFiles();
        } catch (error) {
          console.error('❌ Erreur upload fichier:', error);
          this.errorMessage = 'Erreur lors de l\'upload du fichier';
          return;
        }
      }

      const newMessage = new MiniChatMessage({
        senderId: this.userDetail.id!,
        senderName: this.userDetail.name+' '+this.userDetail.surname,
        senderType: 'admin',
        message: messageText || '',
        conversation: this.activeConversation._id,
        isActivated: true,
        isDeleted: false,
        seen: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Envoyer via Socket.IO

      const success = this.chatService.sendMessage(
        this.namespace,
        this.activeConversation._id,
        newMessage,
        attachments
      );
      this.notifyService.custom('', 'message_sent');

      if (success) {
        this.messageForm.get('message')?.setValue('');
        this.clearFiles();
        this.shouldScrollToBottom = true;
      } else {
        this.showError('Impossible d\'envoyer le message');
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      this.showError('Erreur lors de l\'envoi du message');
    }
  }

  private handleNewMessage(message: MiniChatMessage) {
    // Éviter les doublons
    const exists = this.messages.some(m =>
      m._id === message._id
    );

    if (!exists) {

      this.messages.push(message);
      this.groupMessagesByDate();

      // Mettre à jour la conversation active
      if (this.activeConversation && message.conversation === this.activeConversation._id) {
        this.activeConversation.lastMessage = message;
        this.activeConversation.updatedAt = new Date();

        if (message.senderId !== this.userDetail.id) {
          this.notifyService.custom(`nouveau message`, 'message_received');
          this.activeConversation.unreadCount = 0; // Déjà dans la conversation
        }
      }

      // Mettre à jour la liste des conversations
      const conversation = this.conversations.find(c => c._id === message.conversation);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.updatedAt = new Date();

        if (message.senderId !== this.userDetail.id &&
          (!this.activeConversation || this.activeConversation._id !== conversation._id)) {
          conversation.unreadCount++;
          this.updateUnreadCount();
        }

        // Remonter la conversation en haut de la liste
        this.sortConversations();
      }

      this.shouldScrollToBottom = true;
      this.changeDetectorRef.detectChanges();
    }
  }

  private handleNewConversation(conversation: Conversation) {
    const exists = this.conversations.some(c => c._id === conversation._id);
    if (!exists) {
      this.conversations.unshift(conversation);
      this.filteredConversations = [...this.conversations];
      this.changeDetectorRef.detectChanges();
    }
  }

  private async markConversationAsRead(conversationId: string) {
    try {
      this.chatService.markAsRead(this.namespace, conversationId);
    } catch (error) {
      console.error('❌ Erreur marquage comme lu:', error);
    }
  }

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];

    if (this.selectedFiles.length + files.length > this.maxFiles) {
      this.showError(`Vous ne pouvez sélectionner que ${this.maxFiles} fichiers maximum`);
      this.resetFileInput();
      return;
    }

    files.forEach(file => {
      if (this.validateFile(file)) {
        this.selectedFiles.push(file);

        // Créer une prévisualisation pour les images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.previewUrls.push(e.target.result);
            this.changeDetectorRef.detectChanges();
          };
          reader.readAsDataURL(file);
        } else {
          this.previewUrls.push('');
        }
      }
    });

    this.resetFileInput();
  }

  private validateFile(file: File): boolean {
    if (file.size > this.maxFileSize) {
      this.showError(`Le fichier "${file.name}" est trop volumineux (max ${this.maxFileSize / 1024 / 1024}MB)`);
      return false;
    }
    if (!this.allowedFileTypes.includes(file.type)) {
      this.showError(`Type de fichier "${file.type}" non autorisé pour "${file.name}"`);
      return false;
    }
    return true;
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  clearFiles() {
    this.selectedFiles = [];
    this.previewUrls = [];
  }

  private resetFileInput() {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private async uploadFiles(): Promise<string[]> {
    let fileId: string[] = [];
    const token = await this.authService.getRealToken();
    const uid = await this.authService.getUid();

    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    if (this.selectedFiles) {
      for (const file of this.selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type_', 'internal_chat');
        formData.append('pharmacyId', this.activeConversation._id || '');
        formData.append('uid', uid);

        try {
          const response: any = await this.apiService.post('pharmacy-managment/pharmacies/upload-document', formData, headers).toPromise();
          if (response && response.success) {
            fileId.push(response.fileId);
            console.log('✅ Fichier uploadé avec succès, ID:', fileId);
          } else {
            throw new Error('Réponse invalide du serveur');
          }
        } catch (error) {
          console.error('❌ Erreur upload:', error);
          throw error;
        }
      }
    }
    return fileId;
  }

  downloadFile(attachment: FileClass) {
    if (!attachment?.url) {
      this.showError('Fichier non disponible');
      return;
    }

    try {
      const fileUrl = this.internatPathUrl + attachment.url;
      const filename = attachment.fileName || 'fichier';

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      link.target = '_blank';
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('📥 Téléchargement initié pour:', filename);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      this.showError('Erreur lors du téléchargement du fichier');
    }
  }

  // === UTILITAIRES ===

  getConversationName(conversation: Conversation): string {
    if (conversation.isGroup && conversation.groupName) {
      return conversation.groupName;
    }

    const otherParticipants = conversation.participants
      .filter(p => p._id !== this.userDetail.id);

    if (otherParticipants.length === 0) {
      return 'Conversation vide';
    }

    if (otherParticipants.length === 1) {
      return otherParticipants[0].getFullName();
    }

    return otherParticipants
      .map(p => p.getFullName())
      .slice(0, 2)
      .join(', ') + (otherParticipants.length > 2 ? '...' : '');
  }

  getConversationAvatar(conversation: Conversation): string {
    if (conversation.isGroup) {
      return 'fas fa-users';
    }

    const otherParticipant = conversation.participants
      .find(p => p._id !== this.userDetail.id);

    return otherParticipant?.photoURL || 'fas fa-user';
  }

  getConversationInitials(conversation: Conversation): string {
    if (conversation.isGroup) {
      return 'G';
    }

    const otherParticipant = conversation.participants
      .find(p => p._id !== this.userDetail.id);

    return otherParticipant?.getInitials() || 'U';
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  formatMessageTime(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);

    if (now.toDateString() === messageDate.toDateString()) {
      return messageDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return messageDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatDateGroup(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return 'Aujourd\'hui';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatLastActivity(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  }

  // === RECHERCHE ET FILTRES ===

  filterConversations(query: string) {
    this.searchQuery = query.toLowerCase();

    if (!query.trim()) {
      this.filteredConversations = [...this.conversations];
      return;
    }

    this.filteredConversations = this.conversations.filter(conv => {
      const name = this.getConversationName(conv).toLowerCase();
      const lastMessage = conv.lastMessage?.message.toLowerCase() || '';
      const participants = conv.participants
        .map(p => p.getFullName().toLowerCase())
        .join(' ');

      return name.includes(this.searchQuery) ||
        lastMessage.includes(this.searchQuery) ||
        participants.includes(this.searchQuery);
    });
  }

  filterAdmins(query: string) {
    const searchQuery = query.toLowerCase();

    if (!searchQuery.trim()) {
      this.filteredAdmins = [...this.allAdmins];
      return;
    }

    this.filteredAdmins = this.allAdmins.filter(admin =>
      admin.getFullName().toLowerCase().includes(searchQuery) ||
      admin.email?.toLowerCase().includes(searchQuery)
    );
  }

  // === GESTION DES ÉVÉNEMENTS ===

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  showNewConversationDialog() {
    this.showNewConversation = true;
    this.selectedUsers = [];
    this.filteredAdmins = [...this.allAdmins];
  }

  closeNewConversation() {
    this.showNewConversation = false;
    this.selectedUsers = [];
    this.filteredAdmins = [...this.allAdmins];
  }

  toggleUserSelection(user: Admin) {
    const index = this.selectedUsers.findIndex(u => u._id === user._id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
  }

  isUserSelected(user: Admin): boolean {
    return this.selectedUsers.some(u => u._id === user._id);
  }

  // === GESTION DU SCROLL ===

  scrollToBottom() {
    try {
      if (this.messagesContainer?.nativeElement) {
        setTimeout(() => {
          const element = this.messagesContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }, 50);
      }
    } catch (error) {
      console.error('Erreur lors du scroll:', error);
    }
  }

  onScroll(event: any) {
    const element = event.target;
    const threshold = 100;

    // Vérifier si l'utilisateur est proche du bas
    const isNearBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + threshold;

    if (isNearBottom) {
      this.shouldScrollToBottom = true;
    }
  }

  // === GESTION DE L'ÉTAT ===

  private updateUnreadCount() {
    this.unreadCount = this.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    this.changeDetectorRef.detectChanges();
  }

  private sortConversations() {
    this.conversations.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.updatedAt;
      const dateB = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    this.filteredConversations = [...this.conversations];
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.clearMessages(), 5000);
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.clearMessages(), 3000);
  }

  private handleDisconnection() {
    if (this.connectionRetryCount < this.maxRetryAttempts) {
      this.showError(`Connexion perdue. Tentative de reconnexion ${this.connectionRetryCount}/${this.maxRetryAttempts}...`);

      setTimeout(() => {
        this.connectToMessaging();
      }, 2000 * this.connectionRetryCount);
    } else {
      this.showError('Impossible de se connecter au système de messagerie. Veuillez actualiser la page.');
    }
  }

  // === GESTION DE LA FRAPPE ===

  onTyping() {
    if (!this.isTyping && this.activeConversation) {
      this.isTyping = true;
      // Envoyer signal de frappe via socket
      // this.chatService.sendTypingStatus(this.namespace, this.activeConversation._id, true);
    }

    // Reset du timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      if (this.activeConversation) {
        // this.chatService.sendTypingStatus(this.namespace, this.activeConversation._id, false);
      }
    }, 2000);
  }

  getTypingUsersText(): string {
    const typingArray = Array.from(this.typingUsers);
    const otherTypingUsers = typingArray.filter(userId => userId !== this.userDetail.id);

    if (otherTypingUsers.length === 0) return '';
    if (otherTypingUsers.length === 1) return '1 personne écrit...';
    return `${otherTypingUsers.length} personnes écrivent...`;
  }

  // === DRAG & DROP ===

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const mockEvent = {
        target: {
          files: Array.from(files)
        }
      };
      this.onFileSelected(mockEvent);
    }
  }

  // === ACTIONS SUR LES MESSAGES ===

  canDeleteMessage(message: MiniChatMessage): boolean {
    // L'utilisateur peut supprimer ses propres messages dans les 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return message.senderId === this.userDetail.id &&
      new Date(message.createdAt) > fiveMinutesAgo;
  }

  async deleteMessage(message: MiniChatMessage) {
    if (!this.canDeleteMessage(message)) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      // Marquer comme supprimé localement
      message.isDeleted = true;
      message.deletedAt = new Date();

      // Envoyer la suppression via socket
      // this.chatService.deleteMessage(this.namespace, message._id);

      this.groupMessagesByDate();
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('❌ Erreur suppression message:', error);
      this.showError('Erreur lors de la suppression du message');
    }
  }

  // === GESTION DES PERMISSIONS ===

  canCreateConversation(): boolean {
    return this.allAdmins.length > 0 && this.isConnected;
  }

  canSendMessage(): boolean {
    return !!this.activeConversation && this.isConnected;
  }

  // === CYCLE DE VIE DU COMPOSANT ===

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    console.log('🧹 Nettoyage du composant messagerie');

    // Nettoyer les subjects
    this.destroy$.next();
    this.destroy$.complete();

    // Nettoyer les timeouts
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Quitter les conversations actives
    if (this.activeConversation) {
      this.chatService.leavePharmacyChat(this.namespace, this.activeConversation._id);
    }

    // Déconnexion du namespace
    this.chatService.disconnectFromNamespace(this.namespace);

    // Nettoyer les URLs de prévisualisation
    this.previewUrls.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }

  // === MÉTHODES DE DEBUG ===

  getDebugInfo(): any {
    return {
      namespace: this.namespace,
      isConnected: this.isConnected,
      activeConversation: this.activeConversation?._id,
      messagesCount: this.messages.length,
      conversationsCount: this.conversations.length,
      unreadCount: this.unreadCount,
      connectionRetryCount: this.connectionRetryCount
    };
  }

  logDebugInfo() {
    console.log('📊 Debug Info Messagerie:', this.getDebugInfo());
  }

  protected readonly parseInt = parseInt;
}
