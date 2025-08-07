// ticket-detail.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';

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

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, Select2, FormsModule]
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;
  @ViewChild('attachmentInput') attachmentInput!: ElementRef;

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
  attachedFiles: File[] = [];

  private destroy$ = new Subject<void>();
  private typingTimer: any;

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
    // Récupérer l'ID du ticket depuis l'URL
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

      // Connexion au système de tickets si pas encore connecté
      if (!this.ticketService.isConnected()) {
        await this.ticketService.connectToTicketSystem();
      }

      // Charger le ticket
      await this.loadTicket();

      // Surveiller l'état de connexion
      this.ticketService.getConnectionStatus$()
        .pipe(takeUntil(this.destroy$))
        .subscribe(isConnected => {
          this.isConnected = isConnected;
        });

    } catch (error) {
      console.error('❌ Erreur initialisation ticket detail:', error);
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
          this.updateEditForm();
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
      console.error('❌ Erreur chargement ticket:', error);
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
        [], // attachments seront gérés séparément
        formValue.isInternal
      );

      // Réinitialiser le formulaire
      this.messageForm.patchValue({ content: '' });
      this.attachedFiles = [];
      if (this.attachmentInput) {
        this.attachmentInput.nativeElement.value = '';
      }

      // Faire défiler vers le bas
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);

    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
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
          console.error('❌ Erreur marquage message lu:', error);
        }
      }
    }
  }

  // Actions sur le ticket
  async updateTicket() {
    if (this.editTicketForm.invalid || !this.ticket || this.isUpdatingTicket) {
      return;
    }

    try {
      this.isUpdatingTicket = true;
      const formValue = this.editTicketForm.value;

      await this.ticketService.updateTicket(this.ticket._id!, formValue);

      this.showEditMode = false;
      this.handleSuccess('Ticket mis à jour avec succès');

    } catch (error) {
      console.error('❌ Erreur mise à jour ticket:', error);
      this.handleError('Erreur lors de la mise à jour du ticket');
    } finally {
      this.isUpdatingTicket = false;
    }
  }

  async changeStatus(newStatusString: string) {
    if (!this.ticket) return;

    //damien
    const newStatus = newStatusString as TicketStatus;
    if (!newStatus) return;

    try {
      await this.ticketService.updateTicket(this.ticket._id!, { status: newStatus });
      this.handleSuccess(`Statut changé vers "${this.getStatusLabel(newStatus)}"`);
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      this.handleError('Erreur lors du changement de statut');
    }
  }

  async changePriority(newPriorityStatus: string) {
    if (!this.ticket) return;

    const newPriority = newPriorityStatus as TicketPriority;
    if (!newPriority) return;

    try {
      await this.ticketService.updateTicket(this.ticket._id!, { priority: newPriority });
      this.handleSuccess(`Priorité changée vers "${this.getPriorityLabel(newPriority)}"`);
    } catch (error) {
      console.error('❌ Erreur changement priorité:', error);
      this.handleError('Erreur lors du changement de priorité');
    }
  }

  // Gestion des fichiers
  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.attachedFiles = [...this.attachedFiles, ...files];
  }

  removeAttachment(index: number) {
    this.attachedFiles.splice(index, 1);
  }

  async uploadAttachments(): Promise<string[]> {
    if (this.attachedFiles.length === 0) return [];

    const uploadPromises = this.attachedFiles.map(file =>
      this.ticketService.uploadAttachment(file, this.ticket!._id!)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('❌ Erreur upload fichiers:', error);
      throw error;
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

  getPriorityLabel(priority: TicketPriority): string {
    const option = this.priorityOptions.find(opt => opt.value === priority);
    return option?.label || priority;
  }

  getCategoryLabel(category: TicketCategory): string {
    const option = this.categoryOptions.find(opt => opt.value === category);
    return option?.label || category;
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

  getPriorityClass(priority: TicketPriority): string {
    const classes = {
      'urgent': 'priority-urgent',
      'high': 'priority-high',
      'medium': 'priority-medium',
      'low': 'priority-low'
    };
    return classes[priority] || 'priority-default';
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

    return this.ticket.messages.filter(message =>
      this.showInternalMessages || !message.isInternal
    );
  }

  isCurrentUser(userId: string): boolean {
    return this.currentUser?.id === userId;
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

  protected readonly parseFloat = parseFloat;
}
