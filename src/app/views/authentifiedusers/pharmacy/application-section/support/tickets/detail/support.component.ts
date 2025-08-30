// ticket-detail.component.ts
import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import Quill from 'quill';

import { Ticket, TicketStatus, TicketPriority, TicketCategory } from 'src/app/models/Ticket.class';
import { TicketMessage } from 'src/app/models/TicketMessage.class';
import { UserDetails } from 'src/app/models/UserDatails';
import { TicketService } from 'src/app/controllers/services/ticket.service';
import { AuthService } from 'src/app/controllers/services/auth.service';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { ApiService } from 'src/app/controllers/services/api.service';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Select2 } from 'ng-select2-component';
import Swal from 'sweetalert2';

import Toolbar from 'quill/modules/toolbar';
import {HttpHeaders} from "@angular/common/http";
import {environment} from "../../../../../../../../environments/environment";
import {FileClass} from "../../../../../../../models/File.class";
import {FilesPreviewComponent} from "../../../../../sharedComponents/files-preview/files-preview.component";

Quill.register('modules/toolbar', Toolbar);

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-pharmacy-ticket-detail',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QuillModule, FilesPreviewComponent] //Select2
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;
  @ViewChild('attachmentInput') attachmentInput!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // État du composant
  ticket: Ticket | null = null;
  currentUser: UserDetails | null = null;
  ticketId: string = '';

  // Formulaires
  messageForm: FormGroup;
  editTicketForm: FormGroup;

  // États
  isLoading = false;
  isConnected = false;
  isSendingMessage = false;
  isUpdatingTicket = false;
  isTyping = false;
  errorMessage = '';

  isEditing = false;
  isEditingTitle: boolean = false;
  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    theme: 'snow',
    placeholder: 'Tapez votre message...',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
      ]
    }
  };
  editTextDescription: string = '';
  editTitle: string = '';

  // Options pour les sélecteurs
  statusOptions: FilterOption[] = [
    { value: 'open', label: 'Ouvert' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'pending', label: 'En attente' },
    { value: 'resolved', label: 'Résolu' },
    { value: 'closed', label: 'Fermé' }
  ];

  priorityOptions: FilterOption[] = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'Élevée' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'low', label: 'Faible' }
  ];

  categoryOptions: FilterOption[] = [
    { value: 'technical', label: 'Technique' },
    { value: 'billing', label: 'Facturation' },
    { value: 'account', label: 'Compte' },
    { value: 'feature_request', label: 'Demande de fonctionnalité' },
    { value: 'bug_report', label: 'Rapport de bug' },
    { value: 'general', label: 'Général' }
  ];

  // Modes d'affichage
  showEditMode = false;
  showInternalMessages = true;

  private destroy$ = new Subject<void>();
  private typingTimer: any;
  notExtendMessage: boolean = false;

  protected readonly parseFloat = parseFloat;
  selectedFiles: File[] = [];
  private successMessage: string = '';

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
  previewUrls: string[] = [];
  allAttachements: FileClass[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private ticketService: TicketService,
    private authService: AuthService,
    private loadingService: LoadingService,
    private apiService: ApiService,
    private modalService: NgbModal
  ) {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]],
      isInternal: [false]
    });

    this.editTicketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description: [''],
      category: ['', [Validators.required]],
      priority: ['', [Validators.required]],
      status: ['', [Validators.required]]
    });
  }

  async ngOnInit() {
    this.ticketId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.ticketId) {
      this.router.navigate(['/pharmacy/support']);
      return;
    }

    this.authService.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.currentUser = this.authService.getUserDetails();

        if (loaded && this.currentUser) {
          await this.initializeTicketDetail();
          this.setupRealtimeUpdates();
          this.setupTypingDetection();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.ticketService.clearCurrentTicket();
  }

  // Initialisation
  private async initializeTicketDetail() {
    try {
      this.isLoading = true;

      if (!this.ticketService.isConnected()) {
        await this.ticketService.connectToTicketSystem();
      }
      await this.loadTicket();

      // Surveiller l'état de connexion
      this.ticketService.getConnectionStatus$()
        .pipe(takeUntil(this.destroy$))
        .subscribe(isConnected => {
          this.isConnected = isConnected;
        });

    } catch (error) {
      this.errorMessage = 'Erreur lors du chargement du ticket';
    } finally {
      this.isLoading = false;
    }
  }

  private setupRealtimeUpdates() {
    // Écouter les mises à jour du ticket courant
    this.ticketService.getCurrentTicket$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ticket => {
        if (ticket && ticket._id === this.ticketId) {
          this.ticket = ticket;
          this.editTitle = ticket.title;
          this.editTextDescription = ticket.description;
          this.updateEditForm();
        }
      });

    this.ticketService.getAllAtachements$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(file_ => {
        if (file_ !== null) {
          this.allAttachements = file_;
        }
      });

    // Écouter les nouveaux messages
    this.ticketService.getNewMessages$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (this.ticket && message._id === this.ticket._id) {
          this.ticket.addMessage(message);
          this.scrollToBottom();
          // Marquer automatiquement comme lu si c'est visible
          setTimeout(() => {
            this.markMessagesAsRead();
          }, 1000);
        }
      });

    // Écouter les mises à jour de tickets
    this.ticketService.getTicketUpdates$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedTicket => {
        if (updatedTicket._id === this.ticketId) {
          this.ticket = updatedTicket;
          this.updateEditForm();
        }
      });

    // Écouter les erreurs
    this.ticketService.getErrors$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.errorMessage = error;
        setTimeout(() => this.errorMessage = '', 5000);
      });
  }

  private setupTypingDetection() {
    this.messageForm.get('content')?.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isTyping = true;

        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
          this.isTyping = false;
        }, 1000);
      });
  }

  // Chargement des données
  async loadTicket() {
    try {
      this.ticket = await this.ticketService.getTicketById(this.ticketId);
      this.updateEditForm();

      // Marquer les messages comme lus après un court délai
      setTimeout(() => {
        this.markMessagesAsRead();
      }, 1000);

    } catch (error) {
      if (error.message?.includes('non trouvé')) {
        this.router.navigate(['/pharmacy/support']);
      } else {
        this.errorMessage = 'Erreur lors du chargement du ticket';
      }
    }
  }

  private updateEditForm() {
    if (this.ticket) {
      this.editTicketForm.patchValue({
        title: this.ticket.title,
        description: this.ticket.description,
        category: this.ticket.category,
        priority: this.ticket.priority,
        status: this.ticket.status
      });
    }
  }

  // Actions sur les messages
  async sendMessage() {
    if (this.messageForm.invalid || !this.ticket || this.isSendingMessage) {
      return;
    }

    try {
      this.isSendingMessage = true;
      const formValue = this.messageForm.value;

      const message = await this.ticketService.sendMessage(
        this.ticket._id!,
        formValue.content,
        this.selectedFiles ?? [],
        formValue.isInternal
      );

      // Réinitialiser le formulaire
      this.messageForm.patchValue({ content: '' });
      this.clearFiles();

      // Faire défiler vers le bas
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);

    } catch (error) {
      this.handleError('Erreur lors de l\'envoi du message');
    } finally {
      this.isSendingMessage = false;
    }
  }

  async markMessagesAsRead() {
    if (!this.ticket) return;

    const unreadMessages = this.ticket.messages.filter(m => !m.seen);

    for (const message of unreadMessages) {
      if (message._id) {
        try {
          await this.ticketService.markMessageAsRead(this.ticket._id!, message._id);
        } catch (error) {
        }
      }
    }
  }

  // Actions sur le ticket
  async updateTicket() {

    try {
      this.isUpdatingTicket = true;
      const formValue = {
        title: this.editTitle ?? this.ticket.title,
        description: this.editTextDescription ?? this.ticket.description,
        category: this.ticket.category,
        priority: this.ticket.priority,
        status: this.ticket.status,
      }

      await this.ticketService.updateTicket(this.ticket._id!, formValue);
      this.showEditMode = false;

    } catch (error) {
      this.handleError('Erreur lors de la mise à jour du ticket');
    } finally {
      this.isUpdatingTicket = false;
      this.isEditingTitle = false;
      this.isEditing = false;
    }
  }

  async changeStatus(newStatusString: string) {
    if (!this.ticket) return;

    const newStatus = newStatusString as TicketStatus;
    if (!newStatus) return;

    try {
      await this.ticketService.updateTicket(this.ticket._id!, { status: newStatus });
      this.handleSuccess(`Statut changé vers "${this.getStatusLabel(newStatus)}"`);
      this.ticket.status = newStatus;
      // Fermer le dropdown après sélection
      this.isStatusDropdownOpen = false;
    } catch (error) {
      this.handleError('Erreur lors du changement de statut');
    }
  }

  async changePriority(newPriorityString: string) {
    if (!this.ticket) return;

    const newPriority = newPriorityString as TicketPriority;
    if (!newPriority) return;

    try {
      await this.ticketService.updateTicket(this.ticket._id!, { priority: newPriority });
      this.handleSuccess(`Priorité changée vers "${this.getPriorityLabel(newPriority)}"`);
      this.ticket.priority = newPriority;
      // Fermer le dropdown après sélection
      this.isPriorityDropdownOpen = false;
    } catch (error) {
      this.handleError('Erreur lors du changement de priorité');
    }
  }
  isStatusDropdownOpen = false;
  isPriorityDropdownOpen = false;
  closeDropdown(dropdownElement: ElementRef | any) {
    try {
      // Utiliser l'API Bootstrap directement
      const dropdownEl = dropdownElement?.nativeElement || dropdownElement;
      if (dropdownEl) {
        const dropdown = new (window as any).bootstrap.Dropdown(dropdownEl);
        dropdown.hide();
      }
    } catch (error) {
    }
  }
  // Méthodes de toggle
  toggleStatusDropdown() {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    // Fermer l'autre dropdown si ouvert
    if (this.isStatusDropdownOpen) {
      this.isPriorityDropdownOpen = false;
    }
  }

  togglePriorityDropdown() {
    this.isPriorityDropdownOpen = !this.isPriorityDropdownOpen;
    // Fermer l'autre dropdown si ouvert
    if (this.isPriorityDropdownOpen) {
      this.isStatusDropdownOpen = false;
    }
  }

  // Fermer les dropdowns en cliquant ailleurs (optionnel)
  @HostListener('document:click', ['$event'])
  closeDropdownsOnOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isStatusDropdownOpen = false;
      this.isPriorityDropdownOpen = false;
    }
  }

  // Navigation et UI
  goBack() {
    this.location.back();
  }

  toggleEditMode() {
    this.showEditMode = !this.showEditMode;
    if (this.showEditMode) {
      this.updateEditForm();
    }
  }

  toggleInternalMessages() {
    this.showInternalMessages = !this.showInternalMessages;
  }

  private scrollToBottom() {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  focusMessageInput() {
    setTimeout(() => {
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.focus();
      }
    }, 100);
  }

  // Méthodes utilitaires
  getStatusLabel(status: TicketStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  }
  getStatusClass(status: TicketStatus): string {
    const classes = {
      'open': 'status-open',
      'in_progress': 'status-progress',
      'pending': 'status-pending',
      'resolved': 'status-resolved',
      'closed': 'status-closed'
    };
    return classes[status] || 'status-default';
  }

  getPriorityLabel(priority: TicketPriority): string {
    const option = this.priorityOptions.find(opt => opt.value === priority);
    return option?.label || priority;
  }
  getPriorityClass(priority: TicketPriority): string {
    const classes = {
      'urgent': 'priority-urgent',
      'high': 'priority-high',
      'medium': 'priority-medium',
      'low': 'priority-low'
    };
    return classes[priority] || 'priority-default';
  }

  getCategoryLabel(category: TicketCategory): string {
    const option = this.categoryOptions.find(opt => opt.value === category);
    return option?.label || category;
  }



  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffInHours = (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) { // 7 jours
      return `Il y a ${Math.floor(diffInHours / 24)}j`;
    } else {
      return this.formatDate(date);
    }
  }

  getVisibleMessages(): TicketMessage[] {
    if (!this.ticket) return [];

    const sortedMessages = [...this.ticket.messages]
      .sort((a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
      )
      .filter(message => this.showInternalMessages || !message.isInternal);

    return !this.notExtendMessage
      ? sortedMessages.slice(0, 2)
      : sortedMessages;
  }

  isCurrentUser(userId: string): boolean {
    return this.currentUser?.id === userId;
  }
  enableEdit() {
    this.isEditing = true;
    this.editTextDescription = this.ticket.description;
  }

  // Validation des formulaires
  getFieldError(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'Ce champ est obligatoire';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
    }
    return '';
  }

  isFieldValid(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return control ? control.valid && control.touched : false;
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  // Gestion des erreurs et succès
  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  private handleSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: message,
      timer: 3000,
      showConfirmButton: false
    });
  }

  // Refresh
  async refresh() {
    await this.loadTicket();
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

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.previewUrls.push(e.target.result);
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
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Vérifie si un fichier est une image
   */
  isImageFile(file: FileClass): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const extension = file.extension?.toLowerCase() || file.originalName.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(extension || '');
  }

  /**
   * Retourne l'icône Font Awesome appropriée selon le type de fichier
   */
  getFileIcon(file: FileClass): string {
    const extension = file.extension?.toLowerCase() || file.originalName.split('.').pop()?.toLowerCase();

    const iconMap: { [key: string]: string } = {
      // Documents
      'pdf': 'fas fa-file-pdf file-icon pdf',
      'doc': 'fas fa-file-word file-icon doc',
      'docx': 'fas fa-file-word file-icon docx',
      'txt': 'fas fa-file-alt file-icon txt',

      // Tableurs
      'xls': 'fas fa-file-excel file-icon xls',
      'xlsx': 'fas fa-file-excel file-icon xlsx',
      'csv': 'fas fa-file-csv file-icon csv',

      // Présentations
      'ppt': 'fas fa-file-powerpoint file-icon ppt',
      'pptx': 'fas fa-file-powerpoint file-icon pptx',

      // Archives
      'zip': 'fas fa-file-archive file-icon zip',
      'rar': 'fas fa-file-archive file-icon rar',
      '7z': 'fas fa-file-archive file-icon 7z',

      // Images
      'jpg': 'fas fa-file-image',
      'jpeg': 'fas fa-file-image',
      'png': 'fas fa-file-image',
      'gif': 'fas fa-file-image',
      'bmp': 'fas fa-file-image',
      'webp': 'fas fa-file-image',
      'svg': 'fas fa-file-image',

      // Vidéos
      'mp4': 'fas fa-file-video',
      'avi': 'fas fa-file-video',
      'mov': 'fas fa-file-video',
      'wmv': 'fas fa-file-video',

      // Audio
      'mp3': 'fas fa-file-audio',
      'wav': 'fas fa-file-audio',
      'flac': 'fas fa-file-audio',

      // Autres
      'json': 'fas fa-file-code',
      'xml': 'fas fa-file-code',
      'html': 'fas fa-file-code',
      'css': 'fas fa-file-code',
      'js': 'fas fa-file-code',
      'ts': 'fas fa-file-code'
    };

    return iconMap[extension || ''] || 'fas fa-file';
  }

  /**
   * Formate la taille du fichier de manière lisible
   */
  getFormattedFileSize(sizeInBytes: string | number): string {
    const size = typeof sizeInBytes === 'string' ? parseFloat(sizeInBytes) : sizeInBytes;

    if (size === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(1024));

    return (size / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  }

  /**
   * Retourne un label lisible pour le type de fichier
   */
  getFileTypeLabel(fileType: string): string {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'application/msword': 'Document Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Document Word',
      'application/vnd.ms-excel': 'Tableur Excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Tableur Excel',
      'application/vnd.ms-powerpoint': 'Présentation PowerPoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Présentation PowerPoint',
      'text/plain': 'Texte brut',
      'text/csv': 'Fichier CSV',
      'application/json': 'Fichier JSON',
      'application/xml': 'Fichier XML',
      'text/html': 'Page HTML',
      'text/css': 'Feuille de style CSS',
      'application/javascript': 'Script JavaScript',
      'application/typescript': 'Script TypeScript',
      'application/zip': 'Archive ZIP',
      'application/x-rar-compressed': 'Archive RAR',
      'application/x-7z-compressed': 'Archive 7Z',
      'image/jpeg': 'Image JPEG',
      'image/png': 'Image PNG',
      'image/gif': 'Image GIF',
      'image/bmp': 'Image BMP',
      'image/webp': 'Image WebP',
      'image/svg+xml': 'Image SVG',
      'video/mp4': 'Vidéo MP4',
      'video/avi': 'Vidéo AVI',
      'video/quicktime': 'Vidéo QuickTime',
      'audio/mpeg': 'Audio MP3',
      'audio/wav': 'Audio WAV',
      'audio/flac': 'Audio FLAC'
    };

    return typeMap[fileType] || fileType.split('/').pop()?.toUpperCase() || 'Fichier';
  }

  /**
   * Vérifie si un fichier peut être prévisualisé
   */
  canPreviewFile(file: FileClass): boolean {
    const previewableTypes = [
      'application/pdf',
      'text/plain',
      'text/html',
      'text/csv',
      'application/json',
      'application/xml'
    ];

    return this.isImageFile(file) || previewableTypes.includes(file.fileType);
  }

  /**
   * Vérifie si un fichier expire bientôt (dans les 7 prochains jours)
   */
  isFileExpiringSoon(expiryDate: Date): boolean {
    if (!expiryDate) return false;

    const now = new Date();
    const expiry = new Date(expiryDate);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return expiry > now && expiry <= sevenDaysFromNow;
  }

  /**
   * Télécharge un fichier
   */
  downloadFile(file: FileClass): void {
    if (!file.url) {
      return;
    }

    // Créer un lien de téléchargement temporaire
    const link = document.createElement('a');
    link.href = this.internatPathUrl+file.url;
    link.download = file.originalName;
    link.target = '_blank';

    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Ouvre la prévisualisation d'un fichier
   */
  openFilePreview(file: FileClass): void {
    if (!file.url) {
      return;
    }

    if (this.isImageFile(file)) {
      this.openImageModal(file);
    } else if (this.canPreviewFile(file)) {
      window.open(this.internatPathUrl+file.url, '_blank');
    } else {
      // Fallback : téléchargement
      this.downloadFile(file);
    }
  }

  /**
   * Ouvre une modal pour prévisualiser une image
   */
  private openImageModal(file: FileClass): void {
    const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (popup) {
      popup.document.write(`
      <html>
        <head>
          <title>${file.originalName}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              border-radius: 8px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <img src="${this.internatPathUrl+file.url}" alt="${file.originalName}" />
        </body>
      </html>
    `);
    }
  }

  protected readonly parseInt = parseInt;
}
