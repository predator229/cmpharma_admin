// ticket-list.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {Ticket, TicketCategory, TicketPriority, TicketStatus} from 'src/app/models/Ticket.class';
import {TicketStats} from "../../../../../../../models/TicketStats.class";
import {UserDetails} from "../../../../../../../models/UserDatails";
import { TicketService } from 'src/app/controllers/services/ticket.service';
import {AuthService} from "../../../../../../../controllers/services/auth.service";
import {Select2} from "ng-select2-component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {HttpHeaders} from "@angular/common/http";
import {LoadingService} from "../../../../../../../controllers/services/loading.service";
import Swal from "sweetalert2";
import {Admin} from "../../../../../../../models/Admin.class";
import {Group} from "../../../../../../../models/Group.class";
import {CommonFunctions} from "../../../../../../../controllers/comonsfunctions";
import {ApiService} from "../../../../../../../controllers/services/api.service";
import {PharmacyClass} from "../../../../../../../models/Pharmacy.class";


interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-ticket-list',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, Select2]
})
export class TicketListComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('addEditProductModal') addEditProductModal: ElementRef | undefined;

  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  stats: TicketStats = new TicketStats();
  currentUser: UserDetails | null = null;

  currentPage = 1;
  itemsPerPage = 20;
  totalTickets = 0;
  totalPages = 0;

  isLoading = false;
  isConnected = false;
  errorMessage = '';

  filterForm: FormGroup;
  activeFilters: any = {};
  sortBy = 'lastActivity';
  sortDirection: 'asc' | 'desc' = 'desc';
  pharmaciesArraySelect2: Array<{value: string, label: string}> = [];
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

  viewMode: 'list' | 'grid' | 'kanban' = 'list';
  showFilters = false;
  selectedTickets: Set<string> = new Set();
  ticketForm: FormGroup;

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;
  private pharmacies: PharmacyClass[];
  private users: Admin[];

  protected readonly Object = Object;
  protected readonly Math = Math;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    modalService: NgbModal,
    private loadingService: LoadingService,
    private apiService: ApiService,
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [[]],
      priority: [[]],
      category: [[]],
      dateFrom: [''],
      dateTo: ['']
    })
    this.modalService = modalService;
  }
  get paginationPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  async ngOnInit() {
    this.authService.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.currentUser = this.authService.getUserDetails();
        // this.permissions.viewUsers = this.userDetail.hasPermission('utilisateurs.view');
        // this.permissions.createUser = this.userDetail.hasPermission('utilisateurs.create');
        // this.permissions.editUser = this.userDetail.hasPermission('utilisateurs.edit');
        // this.permissions.deleteUser = this.userDetail.hasPermission('utilisateurs.delete');
        // this.permissions.bulkActions = this.userDetail.hasPermission('utilisateurs.export');

        if (loaded && this.currentUser) {
          await this.initializeTicketSystem();
          this.setupFormSubscriptions();
          this.setupRealtimeUpdates();
          await this.loadTickets();
          await this.loadStats();
        }
      });
  }

  async loadUsers(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      const token = await this.authService.getRealToken();
      const uid = await this.authService.getUid();
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const params = {
        uid,
      };

      this.apiService.post('pharmacy-management/users/list', params, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data && !response.error) {

              this.users = response.data.users.map((user: any) => new Admin(user)) ?? [];

              this.pharmacies = response.pharmsFullInfos.map((item: any) => CommonFunctions.mapToPharmacy(item));
              this.pharmaciesArraySelect2 =
                this.pharmacies.
                filter(pharmacy => pharmacy != null).
                map(pharmacy => ({
                  value: pharmacy.id,
                  label:pharmacy.name
                }));

            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors du chargement des utilisateurs');
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des utilisateurs');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }
  async onSubmit(): Promise<void> {
    if (this.ticketForm.valid) {
      const formData = {
        ...this.ticketForm.value,
        lastActivity: Date(),
      };

      this.loadingService.setLoading(true);
      this.ticketService.createTicket(formData).then(
        async (response: any) => {
          this.loadingService.setLoading(false);
          this.handleSucces('Ticket cree avec success!');
          this.closeModal();
        }
      ).catch(error => {
        this.handleError('Une erreur s\'est produite. Veuillez réessayer!');
        this.loadingService.setLoading(false);
      });
    } else {
      this.handleError("Veuillez remplir tous les champs obligatoires !");
    }
  }
  async loadTickets() {
    try {
      this.isLoading = true;
      const filters = this.buildFilters();

      const response = await this.ticketService.getTickets(
        this.currentPage,
        this.itemsPerPage,
        filters
      );

      this.tickets = response.data;
      this.totalTickets = response.total;
      this.totalPages = response.totalPages;

      this.applyFiltersAndSort();

    } catch (error) {
      console.error('❌ Erreur chargement tickets:', error);
      this.errorMessage = 'Erreur lors du chargement des tickets';
    } finally {
      this.isLoading = false;
    }
  }
  async loadStats() {
    try {
      await this.ticketService.getTicketStats();
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    }
  }
  async bulkUpdateStatus(status: TicketStatus) {
    if (this.selectedTickets.size === 0) return;

    try {
      this.isLoading = true;

      const promises = Array.from(this.selectedTickets).map(ticketId =>
        this.ticketService.updateTicket(ticketId, { status })
      );

      await Promise.all(promises);
      this.selectedTickets.clear();
      await this.loadTickets();

    } catch (error) {
      console.error('❌ Erreur mise à jour en lot:', error);
      this.errorMessage = 'Erreur lors de la mise à jour des tickets';
    } finally {
      this.isLoading = false;
    }
  }
  async refresh() {
    await Promise.all([
      this.loadTickets(),
      this.loadStats()
    ]);
  }

  private async initializeTicketSystem() {
    try {
      this.isLoading = true;
      await this.loadUsers();
      await this.ticketService.connectToTicketSystem();

      this.ticketService.getConnectionStatus$()
        .pipe(takeUntil(this.destroy$))
        .subscribe(isConnected => {
          this.isConnected = isConnected;
          if (isConnected) {
            console.log('✅ Système de tickets connecté');
          }
        });

    } catch (error) {
      console.error('❌ Erreur initialisation système tickets:', error);
      this.errorMessage = 'Erreur de connexion au système de tickets';
    } finally {
      this.isLoading = false;
    }
  }

  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }
  private handleSucces(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Felicitations',
      text: message
    });
  }
  private setupFormSubscriptions() {
    // Recherche en temps réel
    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTickets();
      });

    // Autres filtres
    ['status', 'priority', 'category', 'dateFrom', 'dateTo'].forEach(field => {
      this.filterForm.get(field)?.valueChanges
        .pipe(
          debounceTime(300),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.currentPage = 1;
          this.loadTickets();
        });
    });
  }
  private setupRealtimeUpdates() {
    // Nouveaux tickets et mises à jour
    this.ticketService.getTickets$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tickets => {
        this.tickets = tickets;
        this.applyFiltersAndSort();
      });

    // Mise à jour des stats
    this.ticketService.getStats$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
        this.updateFilterCounts();
      });

    // Gestion des erreurs
    this.ticketService.getErrors$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.errorMessage = error;
        setTimeout(() => this.errorMessage = '', 5000);
      });
  }
  private buildFilters(): any {
    const formValue = this.filterForm.value;
    const filters: any = {};

    if (formValue.search?.trim()) {
      filters.search = formValue.search.trim();
    }

    if (formValue.status?.length > 0) {
      filters.status = formValue.status;
    }

    if (formValue.priority?.length > 0) {
      filters.priority = formValue.priority;
    }

    if (formValue.category?.length > 0) {
      filters.category = formValue.category;
    }

    if (formValue.dateFrom) {
      filters.dateFrom = new Date(formValue.dateFrom);
    }

    if (formValue.dateTo) {
      filters.dateTo = new Date(formValue.dateTo);
    }

    // Filtrer par pharmacie si utilisateur pharmacie
    filters.pharmacy = this.currentUser.id;

    return filters;
  }
  private applyFiltersAndSort() {
    let filtered = [...this.tickets];

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof Ticket];
      let bValue: any = b[this.sortBy as keyof Ticket];

      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredTickets = filtered;
  }
  private updateFilterCounts() {
    this.statusOptions.forEach(option => {
      switch(option.value) {
        case 'open': option.count = this.stats.open; break;
        case 'in_progress': option.count = this.stats.inProgress; break;
        case 'pending': option.count = this.stats.pending; break;
        case 'resolved': option.count = this.stats.resolved; break;
        case 'closed': option.count = this.stats.closed; break;
      }
    });

    this.priorityOptions.forEach(option => {
      const priority = option.value as keyof typeof this.stats.byPriority;
      option.count = this.stats.byPriority[priority];
    });

    this.categoryOptions.forEach(option => {
      const category = option.value as keyof typeof this.stats.byCategory;
      option.count = this.stats.byCategory[category];
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.ticketService.disconnect();
  }

  createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description: [''],
      category: ['', [Validators.required]],
      priority: ['', [Validators.required]],
      status: ['', [Validators.required]],
      pharmacy: ['', [Validators.required]],
      isPrivate: ['', [Validators.required]],
    });
  }
  createNewTicket(): void {
    this.ticketForm = this.createForm();
    this.ticketForm.patchValue({
      title: '',
      description: '',
      category: this.categoryOptions[0].value,
      priority: this.priorityOptions[0].value,
      status: this.statusOptions[0].value,
      pharmacy: this.pharmaciesArraySelect2[0].value,
      isPrivate: false,
    })
    this.modalService.dismissAll('ok');
    setTimeout(() => {
      this.modalService.open(this.addEditProductModal, {
        size: 'xl',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }
  closeModal(): void {
    this.modalService.dismissAll('ok');
  }
  getFieldError(fieldName: string): string {
    const control = this.ticketForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'Ce champ est obligatoire';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      if (control.errors['pattern']) return 'Format invalide (lettres, chiffres et tirets uniquement)';
      if (control.errors['min']) return `Valeur minimale: ${control.errors['min'].min}`;
    }
    return '';
  }
  isFieldValid(fieldName: string): boolean {
    const control = this.ticketForm.get(fieldName);
    return control ? control.valid && control.touched : false;
  }
  isFieldInvalid(fieldName: string): boolean {
    const control = this.ticketForm.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }
  openTicket(ticket: Ticket) {
    this.router.navigate(['pharmacy/support', ticket._id]);
  }
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTickets();
    }
  }
  sortBy_(field: string) {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'desc';
    }
    this.applyFiltersAndSort();
  }
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  clearFilters() {
    this.filterForm.reset({
      search: '',
      status: [],
      priority: [],
      category: [],
      dateFrom: '',
      dateTo: ''
    });
    this.currentPage = 1;
    this.loadTickets();
  }
  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      formValue.search?.trim() ||
      formValue.status?.length > 0 ||
      formValue.priority?.length > 0 ||
      formValue.category?.length > 0 ||
      formValue.dateFrom ||
      formValue.dateTo
    );
  }
  changeView(mode: 'list' | 'grid' | 'kanban') {
    this.viewMode = mode;
  }
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
  onStatusFilterChange(event: any) {
    const value = event.target.value;
    const checked = event.target.checked;
    const currentStatus = this.filterForm.get('status')?.value || [];

    if (checked && !currentStatus.includes(value)) {
      this.filterForm.patchValue({
        status: [...currentStatus, value]
      });
    } else if (!checked && currentStatus.includes(value)) {
      this.filterForm.patchValue({
        status: currentStatus.filter((s: string) => s !== value)
      });
    }
  }
  onPriorityFilterChange(event: any) {
    const value = event.target.value;
    const checked = event.target.checked;
    const currentPriority = this.filterForm.get('priority')?.value || [];

    if (checked && !currentPriority.includes(value)) {
      this.filterForm.patchValue({
        priority: [...currentPriority, value]
      });
    } else if (!checked && currentPriority.includes(value)) {
      this.filterForm.patchValue({
        priority: currentPriority.filter((p: string) => p !== value)
      });
    }
  }
  onCategoryFilterChange(event: any) {
    const value = event.target.value;
    const checked = event.target.checked;
    const currentCategory = this.filterForm.get('category')?.value || [];

    if (checked && !currentCategory.includes(value)) {
      this.filterForm.patchValue({
        category: [...currentCategory, value]
      });
    } else if (!checked && currentCategory.includes(value)) {
      this.filterForm.patchValue({
        category: currentCategory.filter((c: string) => c !== value)
      });
    }
  }
  getTicketsByStatus(status: string): Ticket[] {
    return this.filteredTickets.filter(ticket => ticket.status === status);
  }
  trackByTicketId(index: number, ticket: Ticket): string {
    return ticket._id || index.toString();
  }
  toggleTicketSelection(ticketId: string) {
    if (this.selectedTickets.has(ticketId)) {
      this.selectedTickets.delete(ticketId);
    } else {
      this.selectedTickets.add(ticketId);
    }
  }
  selectAllTickets() {
    if (this.selectedTickets.size === this.filteredTickets.length) {
      this.selectedTickets.clear();
    } else {
      this.filteredTickets.forEach(ticket => {
        if (ticket._id) {
          this.selectedTickets.add(ticket._id);
        }
      });
    }
  }
}
