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
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../theme/shared/shared.module';

import { Admin } from '../../../../../models/Admin.class';
import { MiniChatMessage } from '../../../../../models/MiniChatMessage.class';
import { FileClass } from '../../../../../models/File.class';
import { AuthService } from '../../../../../controllers/services/auth.service';
import { ApiService } from '../../../../../controllers/services/api.service';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import {Conversation} from "../../../../../models/Conversation.class";
import {MessageGroup} from "../../../../../models/MessageGroupe.class";


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
  currentUser!: Admin;
  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  messages: MiniChatMessage[] = [];
  groupedMessages: MessageGroup[] = [];

  // Utilisateurs et contacts
  allAdmins: Admin[] = [];
  onlineUsers: string[] = [];
  selectedUsers: Admin[] = [];

  // Interface
  isLoading = false;
  isConnected = false;
  showNewConversation = false;
  showUserList = false;
  searchQuery = '';
  filteredConversations: Conversation[] = [];

  // Messages
  messageForm: FormGroup;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  isTyping = false;
  typingUsers: string[] = [];

  // Configuration
  internatPathUrl = environment.internalPathUrl;
  maxFileSize = 10 * 1024 * 1024; // 10MB
  allowedFileTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;
  private typingTimeout: any;
  private reconnectInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.messageForm = this.fb.group({
      message: ['', [Validators.maxLength(2000)]]
    });
  }

  async ngOnInit() {
    await this.initializeComponent();
  }

  private async initializeComponent() {
    this.isLoading = true;

    try {
      // Charger l'utilisateur actuel
      await this.loadCurrentUser();

      // Charger tous les administrateurs
      await this.loadAllAdmins();

      // Charger les conversations
      await this.loadConversations();

      // Connecter au système de messagerie temps réel
      await this.connectToMessaging();

      // Configurer la recherche
      this.setupSearch();

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadCurrentUser() {
    try {
      const userData = this.authService.getUserDetails();
      this.currentUser = new Admin(userData);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur actuel:', error);
      throw error;
    }
  }

  private async loadAllAdmins() {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await this.apiService.post('pharmacy-management/users/list', {uid}, headers).toPromise();
      if (response && !response.error && response.data) {
        this.allAdmins = response.data.users
          .filter((admin: any) => admin._id !== this.currentUser._id)
          .map((admin: any) => new Admin(admin));
      }
    } catch (error) {
      console.error('❌ Erreur chargement administrateurs:', error);
    }
  }

  private async loadConversations() {
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await this.apiService.post('chat/pharmacy/messages/conversation', {uid}, headers).toPromise();

      if (response && response.success && !response.error && response.data) {
        this.conversations = response.data.map((conv: any) => ({
          id: conv._id,
          participants: conv.participants.map((p: any) => new Admin(p)),
          lastMessage: conv.lastMessage ? new MiniChatMessage(conv.lastMessage) : undefined,
          unreadCount: conv.unreadCount || 0,
          isGroup: conv.isGroup || false,
          groupName: conv.groupName,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt)
        }));

        this.filteredConversations = [...this.conversations];

        // Sélectionner la première conversation
        if (this.conversations.length > 0 && !this.activeConversation) {
          this.selectConversation(this.conversations[0]);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error);
    }
  }

  private async connectToMessaging() {
    this.isConnected = true;
    this.onlineUsers = this.allAdmins
      .filter(() => Math.random() > 0.6)
      .map(admin => admin._id!);
  }

  private setupSearch() {
    this.messageForm.get('search')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(query => {
        this.filterConversations(query);
      });
  }

  async selectConversation(conversation: Conversation) {
    if (this.activeConversation?._id === conversation._id) return;

    this.activeConversation = conversation;
    this.messages = [];
    this.groupedMessages = [];

    conversation.unreadCount = 0;
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

      const response: any = await this.apiService.post(`chat/pharmacy/messages/conversation/loadMessage`, {uid, conversationId}, headers).toPromise();

      if (response && response.success) {
        this.messages = response.data.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt)
        }));

        this.groupMessagesByDate();
        this.shouldScrollToBottom = true;
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
    }
  }

  private groupMessagesByDate() {
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
    if (this.selectedUsers.length === 0) return;

    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const body = {
        createConversation: true,
        uid,
        participants: this.selectedUsers.map(user => user._id),
        isGroup: this.selectedUsers.length > 1,
        groupName: this.selectedUsers.length > 1 ?
          `Groupe ${this.selectedUsers.map(u => u.getFullName()).join(', ')}` :
          undefined
      };

      const response: any = await this.apiService.post('chat/pharmacy/messages/conversation/create', body, headers).toPromise();

      if (response && response.success) {
        const newConversation: Conversation = {
          _id: response.data._id,
          participants: this.selectedUsers,
          unreadCount: 0,
          isGroup: body.isGroup,
          groupName: body.groupName,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.conversations.unshift(newConversation);
        this.filteredConversations = [...this.conversations];

        this.selectConversation(newConversation);
        this.closeNewConversation();
      }
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
    }
  }

  // === GESTION DES MESSAGES ===

  async sendMessage() {
    const messageText = this.messageForm.get('message')?.value?.trim();

    if (!this.activeConversation || (!messageText && this.selectedFiles.length === 0)) {
      return;
    }

    try {
      // Uploader les fichiers si nécessaire
      let attachments: string[] = [];
      if (this.selectedFiles.length > 0) {
        attachments = await this.uploadFiles();
      }

      const token = await this.authService.getRealToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const body = {
        conversationId: this.activeConversation._id,
        message: messageText || '',
        attachments: attachments.length > 0 ? attachments : undefined
      };

      const response: any = await this.apiService.post(
        'messaging/messages',
        body,
        headers
      ).toPromise();

      if (response && response.success) {
        const newMessage: MiniChatMessage = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt)
        };

        this.messages.push(newMessage);
        this.groupMessagesByDate();

        // Mettre à jour la conversation
        this.activeConversation.lastMessage = newMessage;
        this.activeConversation.updatedAt = new Date();

        // Réinitialiser le formulaire
        this.messageForm.get('message')?.setValue('');
        this.clearFiles();

        this.shouldScrollToBottom = true;
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    }
  }

  // === GESTION DES FICHIERS ===

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];

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

    // Reset input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private validateFile(file: File): boolean {
    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      alert(`Le fichier "${file.name}" est trop volumineux (max ${this.maxFileSize / 1024 / 1024}MB)`);
      return false;
    }

    // Vérifier le type
    if (!this.allowedFileTypes.includes(file.type)) {
      alert(`Type de fichier "${file.type}" non autorisé`);
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

  private async uploadFiles(): Promise<string[]> {
    const fileIds: string[] = [];
    const token = await this.authService.getRealToken();
    const uid = await this.authService.getUid();

    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    for (const file of this.selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type_', 'internal_messaging');
      formData.append('uid', uid);

      try {
        const response: any = await this.apiService.post(
          'messaging/upload',
          formData,
          headers
        ).toPromise();

        if (response && response.success) {
          fileIds.push(response.fileId);
        }
      } catch (error) {
        console.error('❌ Erreur upload fichier:', error);
      }
    }

    return fileIds;
  }

  // === UTILITAIRES ===

  getConversationName(conversation: Conversation): string {
    if (conversation.isGroup && conversation.groupName) {
      return conversation.groupName;
    }

    const otherParticipants = conversation.participants
      .filter(p => p._id !== this.currentUser._id);

    if (otherParticipants.length === 1) {
      return otherParticipants[0].getFullName();
    }

    return otherParticipants
      .map(p => p.getFullName())
      .join(', ');
  }

  getConversationAvatar(conversation: Conversation): string {
    if (conversation.isGroup) {
      return 'fas fa-users';
    }

    const otherParticipant = conversation.participants
      .find(p => p._id !== this.currentUser._id);

    return otherParticipant?.photoURL || 'fas fa-user';
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.includes(userId);
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

  // === RECHERCHE ET FILTRES ===

  filterConversations(query: string) {
    this.searchQuery = query.toLowerCase();

    if (!query) {
      this.filteredConversations = [...this.conversations];
      return;
    }

    this.filteredConversations = this.conversations.filter(conv => {
      const name = this.getConversationName(conv).toLowerCase();
      const lastMessage = conv.lastMessage?.message.toLowerCase() || '';

      return name.includes(this.searchQuery) || lastMessage.includes(this.searchQuery);
    });
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
  }

  closeNewConversation() {
    this.showNewConversation = false;
    this.selectedUsers = [];
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

  scrollToBottom() {
    try {
      if (this.messagesContainer) {
        setTimeout(() => {
          this.messagesContainer.nativeElement.scrollTop =
            this.messagesContainer.nativeElement.scrollHeight;
        }, 100);
      }
    } catch (err) {
      console.error('Erreur lors du scroll:', err);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
  }

  protected readonly parseInt = parseInt;
}
