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
  selectedFiles: File;

  constructor(
    private fb: FormBuilder,
    private chatService: MiniChatService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private apiService : ApiService
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

      this.chatService.connect(token, this.pharmacy.id);

      // État de la connexion
      this.chatService.getConnectionStatus()
        .pipe(takeUntil(this.destroy$))
        .subscribe(async isConnected => {
          this.isConnected = isConnected;
          console.log(`🔗 État connexion: ${isConnected}`);

          if (isConnected && this.pharmacy?.id) {
            await this.loadChatHistory();
          }

          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });

      this.chatService.getMessages()
        .pipe(takeUntil(this.destroy$))
        .subscribe((message: MiniChatMessage) => {
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

  async sendMessage() {
    if (this.messageForm.valid && this.messageForm.value.message.trim()) {
      const messageText = this.messageForm.value.message.trim();
      let attachments = null;
      if (this.selectedFiles) {
        attachments = await this.uploadFiles();
      }
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

      this.messageForm.reset();
      console.log('the atachement', attachments)
      const success = this.chatService.sendMessage(this.pharmacy.id, newMessage, attachments);
      if (success) {
        this.shouldScrollToBottom = true;
        this.removeFile();
      } else {
        this.errorMessage = 'Impossible d\'envoyer le message';
      }
    }
  }

  // onFileSelected(event: any) {
  //   const files = event.target.files;
  //   if (files && files.length > 0) {
  //     const file = files[0];
  //
  //     // Validation du fichier
  //     if (file.size > 10 * 1024 * 1024) { // 10MB max
  //       alert('Le fichier est trop volumineux (max 10MB)');
  //       return;
  //     }
  //
  //     const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword'];
  //     if (!allowedTypes.includes(file.type)) {
  //       alert('Type de fichier non autorisé');
  //       return;
  //     }
  //
  //     // Ici, vous uploaderiez le fichier et créeriez le message avec l'attachment
  //     console.log('Fichier sélectionné:', file);
  //
  //     // Reset de l'input
  //     this.fileInput.nativeElement.value = '';
  //   }
  // }

  markAllAsRead() {
    this.messages.forEach(message => {
      if (message.senderType === 'admin') {
        message.seen = true;
      }
    });
    this.unreadCount = 0;

    // Marquer comme lu côté serveur
    this.chatService.markAsRead(this.pharmacy.id);
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
            console.log(message.attachments);
          }
        })
        this.shouldScrollToBottom = true;
        console.log(`📜 Historique chargé: ${history.length} messages`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'historique:', error);
    }
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
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validation du type de fichier
    if (!this.isValidFileType(file)) {
      alert('Type de fichier non autorisé. Formats acceptés: PDF, DOC, DOCX, JPG, PNG');
      this.resetFileInput();
      return;
    }

    // Validation de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximum: 5MB');
      this.resetFileInput();
      return;
    }

    // Stocker le fichier
    this.selectedFiles = file;

    // Créer une prévisualisation pour les images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewDoc = e.target.result;
        this.changeDetectorRef.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      // Pour les autres types de fichiers, pas de prévisualisation
      this.previewDoc = '';
    }
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

  removeFile(): void {
    delete this.selectedFiles;
    delete this.previewDoc;
    this.resetFileInput();
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
  private async uploadFiles(): Promise<string> {
    let fileId: string = '';
    const token = await this.authService.getRealToken();
    const uid = await this.authService.getUid();

    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    if (this.selectedFiles) {
      const formData = new FormData();
      formData.append('file', this.selectedFiles);
      formData.append('type_', 'chat_pharm_apartment');
      formData.append('pharmacyId', this.pharmacy.id || '');
      formData.append('uid', uid);

      try {
        const response: any = await this.apiService.post('pharmacy-managment/pharmacies/upload-document', formData, headers).toPromise();
        if (response && response.success) {
          fileId = response.fileId;
        }
      } catch (error) {
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
    } catch (error) {
      alert('Erreur lors du téléchargement du fichier. Veuillez réessayer.');
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }
}
