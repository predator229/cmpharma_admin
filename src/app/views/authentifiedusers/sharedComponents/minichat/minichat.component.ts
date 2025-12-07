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
import {HttpHeaders} from "@angular/common/http";
import {ApiService} from "../../../../controllers/services/api.service";
import {ChatAttaschment} from "../../../../models/ChatAttaschment.class";
import {environment} from "../../../../../environments/environment";
import {FileClass} from "../../../../models/File.class";

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
  previewDoc: string;
  unreadCount = 0;
  errorMessage = '';
  internatPathUrl = environment.internalPathUrl;

  messages: MiniChatMessage[] = [];
  allUsersInfos: AdminUser[] = [];
  messageForm: FormGroup;
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;
  private typingTimeout: any;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  // Namespace pour ce component spécifique
  private namespace = 'pharmacy_contact_admin';
  maxFileSize = 10 * 1024 * 1024; // 10MB
  maxFiles = 5;
  private successMessage: string;
  allowedFileTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  constructor(
    private fb: FormBuilder,
    private chatService: MiniChatService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private apiService: ApiService
  ) {
    this.messageForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  async ngOnInit() {
    this.isLoading = true;
    await this.connectToChat();
    this.loadOnlineAdmins();
    // this.setupFormTypingIndicator();
  }

  async connectToChat() {
    try {
      const token = await this.authService.getRealToken();
      if (!token) {
        this.errorMessage = 'Token d\'authentification manquant';
        this.isLoading = false;
        return;
      }

      // Connexion au namespace spécifique
      this.chatService.connectToNamespace(this.namespace, token, this.pharmacy.id);

      // État de la connexion pour ce namespace spécifique
      this.chatService.getConnectionStatusForNamespace(this.namespace)
        .pipe(takeUntil(this.destroy$))
        .subscribe(async isConnected => {
          this.isConnected = isConnected;
          console.log(`🔗 État connexion namespace ${this.namespace}: ${isConnected}`);

          if (isConnected && this.pharmacy?.id) {
            await this.loadChatHistory();
          }

          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });

      this.chatService.getMessages()
        .pipe(takeUntil(this.destroy$))
        .subscribe((message: MiniChatMessage) => {
          if (message.namespace === this.namespace) {
            const existingMessage = this.messages.find(m => {
              return m.createdAt === message.createdAt &&
                m.senderId === message.senderId &&
                m.message === message.message;
            });

            if (!existingMessage) {
              this.messages.push(message);

              if (message.senderId !== this.currentUser.id && !this.isChatOpen) {
                this.unreadCount++;
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

  async sendMessage() {
    if (typeof this.messageForm.value.message !== 'undefined' || (this.selectedFiles && this.selectedFiles.length > 0)) {
      const messageText = this.messageForm.value.message?.trim();
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

      const newMessage: MiniChatMessage = {
        senderId: this.currentUser.id ?? '',
        senderName: this.currentUser.name ?? '',
        senderType: this.userType,
        message: messageText,
        for: this.pharmacy.id,
        isActivated: true,
        isDeleted: false,
        seen: false,
        deletedAt: null,
        seenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.messageForm.reset();
      const success = this.chatService.sendMessage(
        this.namespace,
        this.pharmacy.id,
        newMessage,
        attachments
      );

      if (success) {
        this.shouldScrollToBottom = true;
        this.clearFiles();
      } else {
        this.errorMessage = 'Impossible d\'envoyer le message';
      }
    }
  }

  markAllAsRead() {
    this.messages.forEach(message => {
      if (message.senderType === 'admin') {
        message.seen = true;
      }
    });
    this.unreadCount = 0;

    // Marquer comme lu côté serveur pour ce namespace
    this.chatService.markAsRead(this.namespace, this.pharmacy.id);
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
        this.messages.forEach(message => {
          if (message.attachments !== null && message.attachments) {
            console.log('📎 Attachement trouvé:', message.attachments);
          }
        });
        this.shouldScrollToBottom = true;
        console.log(`📜 Historique chargé: ${history.length} messages pour namespace ${this.namespace}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'historique:', error);
    }
  }

  ngOnDestroy() {
    console.log(`🧹 Nettoyage component pour namespace: ${this.namespace}`);

    this.destroy$.next();
    this.destroy$.complete();

    // Quitter le chat et déconnecter du namespace
    if (this.pharmacy?.id) {
      this.chatService.leavePharmacyChat(this.namespace, this.pharmacy.id);
    }

    // Déconnexion du namespace spécifique
    this.chatService.disconnectFromNamespace(this.namespace);

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileTypeLabel(mimeType: string): string {
    const types: { [key: string]: string } = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX'
    };

    return types[mimeType] || 'Fichier';
  }
  private showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.clearMessages(), 5000);
  }
  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
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

  private isValidFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(file.type);
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  private resetFileInput(): void {
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const mockEvent = {
        target: {
          files: [files[0]]
        }
      };
      this.onFileSelected(mockEvent);
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
      for (const file_ of this.selectedFiles) {
        if (!file_) { continue; }
        const formData = new FormData();
        formData.append('file', file_);
        formData.append('type_', 'chat_pharm_apartment');
        formData.append('pharmacyId', this.pharmacy.id || '');
        formData.append('uid', uid);

        try {
          const response: any = await this.apiService.post('pharmacy-management/pharmacies/upload-document', formData, headers).toPromise();
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

  downloadFile(attachment: FileClass): void {
    if (!attachment || !attachment.url) {
      console.error('Aucun fichier à télécharger');
      return;
    }

    try {
      const fileUrl = this.internatPathUrl + attachment.url;
      const filename: string = attachment.fileName || 'fichier';
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
      alert('Erreur lors du téléchargement du fichier. Veuillez réessayer.');
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // Méthodes utilitaires pour déboguer le namespace
  isNamespaceConnected(): boolean {
    return this.chatService.isConnectedToNamespace(this.namespace);
  }

  getCurrentPharmacyForNamespace(): string | null {
    return this.chatService.getCurrentPharmacyForNamespace(this.namespace);
  }

  logNamespaceInfo(): void {
    console.log('📊 Info namespace:', {
      namespace: this.namespace,
      isConnected: this.isNamespaceConnected(),
      currentPharmacy: this.getCurrentPharmacyForNamespace(),
      connectedNamespaces: this.chatService.getConnectedNamespaces()
    });
  }

  clearFiles() {
    this.selectedFiles = [];
    this.previewUrls = [];
  }

  protected readonly parseInt = parseInt;
}
