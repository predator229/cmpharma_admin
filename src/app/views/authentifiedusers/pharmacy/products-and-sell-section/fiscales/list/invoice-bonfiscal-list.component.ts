import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {OrderClass} from "../../../../../../models/Order.class";
import {CustomerClass} from "../../../../../../models/Customer.class";
import { PharmacyClass } from 'src/app/models/Pharmacy.class';
import {SharedModule} from "../../../../../theme/shared/shared.module";
import {AuthService} from "../../../../../../controllers/services/auth.service";
import {ApiService} from "../../../../../../controllers/services/api.service";
import {UserDetails} from "../../../../../../models/UserDatails";
import {environment} from "../../../../../../../environments/environment";

export enum DocumentType {
  INVOICE = 'invoice',
  BON_FISCAL = 'bon_fiscal',
  ALL = 'all'
}

export interface DocumentItem {
  _id?: string;
  type: DocumentType;
  documentNumber: string;
  order?: OrderClass;
  customer?: CustomerClass;
  pharmacy?: PharmacyClass;
  createdAt: Date;
  updatedAt: Date;
  pdfData?: Buffer;
  htmlData?: string;
  notes?: any[];
  generations?: any[];
}

@Component({
  selector: 'app-pharmacyinvoice-bonfiscal-list',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule, FormsModule],
  templateUrl: './invoice-bonfiscal-list.component.html',
  styleUrls: ['./invoice-bonfiscal-list.component.scss']
})
export class PharmacyInvoiceBonFiscalListComponent implements OnInit, OnDestroy {
  documents: DocumentItem[] = [];
  filteredDocuments: DocumentItem[] = [];
  selectedDocument: DocumentItem | null = null;

  searchText: string = '';
  typeFilter: string = '';
  customerFilter: string = '';
  pharmacyFilter: string = '';
  dateFromFilter: string = '';
  dateToFilter: string = '';
  sortColumn: string = 'createdAt';
  sortDirection: string = 'desc';

  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginationStart: number = 0;
  paginationEnd: number = 0;
  currentPage: number = 1;

  errorMessage: string = '';
  internatPathUrl = environment.internalPathUrl;
  lastUpdated = new Date();
  isPeriodDropdownOpen: boolean = false;
  optionsPeriodDatas = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '3m', label: '3 derniers mois' },
    { value: '6m', label: '6 derniers mois' },
    { value: '1y', label: '1 an' },
    { value: 'all', label: 'Toute la période' }
  ];

  permissions = {
    viewDocuments: false,
    generateDocuments: false,
    deleteDocuments: false,
    exportDocuments: false,
    downloadDocuments: false,
  };

  // Enums for templates
  DocumentType = DocumentType;

  addNoteForm: FormGroup;
  isSubmitting: boolean = false;

  private destroy$ = new Subject<void>();
  private modalService: NgbModal;

  isLoading: boolean = false;

  @ViewChild('documentDetailsModal') documentDetailsModal: ElementRef | undefined;
  @ViewChild('addNoteModal') addNoteModal: ElementRef | undefined;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;
  pharmaciesListArray: Array<{value: string, label: string}> = [];
  customersListArray: Array<{value: string, label: string}> = [];
  selectedPeriod: string = '30d';

  constructor(
    modalService: NgbModal,
    private auth: AuthService,
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private fb: FormBuilder
  ) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
    this.modalService = modalService;
  }

  ngOnInit(): void {
    this.auth.userDetailsLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async loaded => {
        this.userDetail = this.auth.getUserDetails();
        this.permissions.viewDocuments = this.userDetail.hasPermission('documents.view');
        this.permissions.generateDocuments = this.userDetail.hasPermission('documents.generate');
        this.permissions.deleteDocuments = this.userDetail.hasPermission('documents.delete');
        this.permissions.exportDocuments = this.userDetail.hasPermission('documents.export');
        this.permissions.downloadDocuments = this.userDetail.hasPermission('documents.download');

        if (loaded && this.userDetail) {
          await this.loadDocuments();
        }
      });

    this.createNoteForm();
  }

  createNoteForm(): FormGroup {
    return this.addNoteForm = this.fb.group({
      note: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadDocuments(): Promise<void> {
    this.loadingService.setLoading(true);
    this.errorMessage = '';

    try {
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      if (!this.permissions.viewDocuments) {
        this.documents = [];
        this.pharmaciesListArray = [];
        this.customersListArray = [];
        this.filterDocuments();
        return;
      }

      this.apiService.post('pharmacy-management/documents/list', { uid, period: this.selectedPeriod }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.documents = this.processDocuments(response.data);
              this.filterDocuments();
              this.pharmaciesListArray = response.pharmaciesList ?? [];
              this.customersListArray = response.customersList ?? [];
            } else {
              this.documents = [];
              this.filterDocuments();
            }
            this.lastUpdated = new Date();
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des documents');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
  }

  private processDocuments(data: any): DocumentItem[] {
    const documents: DocumentItem[] = [];

    // Process invoices
    if (data.invoices && data.invoices.length > 0) {
      data.invoices.forEach((invoice: any) => {
        documents.push({
          _id: invoice._id,
          type: DocumentType.INVOICE,
          documentNumber: invoice.invoiceNumber,
          order: invoice.order ? new OrderClass(invoice.order) : undefined,
          customer: invoice.order?.customer ? new CustomerClass(invoice.order.customer) : undefined,
          pharmacy: invoice.order?.pharmacy ? new PharmacyClass(invoice.order.pharmacy) : undefined,
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt),
          pdfData: invoice.pdfData,
          htmlData: invoice.htmlData,
          notes: invoice.invoiceNotes || [],
          generations: invoice.generations || []
        });
      });
    }

    // Process bon fiscaux
    if (data.bonFiscaux && data.bonFiscaux.length > 0) {
      data.bonFiscaux.forEach((bonFiscal: any) => {
        documents.push({
          _id: bonFiscal._id,
          type: DocumentType.BON_FISCAL,
          documentNumber: bonFiscal.bonfiscalNumber,
          order: bonFiscal.order ? new OrderClass(bonFiscal.order) : undefined,
          customer: bonFiscal.order?.customer ? new CustomerClass(bonFiscal.order.customer) : undefined,
          pharmacy: bonFiscal.order?.pharmacy ? new PharmacyClass(bonFiscal.order.pharmacy) : undefined,
          createdAt: new Date(bonFiscal.createdAt),
          updatedAt: new Date(bonFiscal.updatedAt),
          pdfData: bonFiscal.pdfData,
          htmlData: bonFiscal.htmlData,
          notes: bonFiscal.bonfiscalNotes || [],
          generations: bonFiscal.generations || []
        });
      });
    }

    return documents;
  }

  filterDocuments(): void {
    let filtered = [...this.documents];

    if (this.searchText) {
      const searchTerms = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(d =>
        d.documentNumber?.toLowerCase().includes(searchTerms) ||
        d.customer?.getFullName().toLowerCase().includes(searchTerms) ||
        d.customer?.email?.toLowerCase().includes(searchTerms) ||
        d.pharmacy?.name?.toLowerCase().includes(searchTerms) ||
        d.order?.orderNumber?.toLowerCase().includes(searchTerms)
      );
    }

    if (this.typeFilter) {
      filtered = filtered.filter(d => d.type === this.typeFilter);
    }

    if (this.pharmacyFilter) {
      filtered = filtered.filter(d => d.pharmacy?.id === this.pharmacyFilter);
    }

    if (this.customerFilter) {
      filtered = filtered.filter(d => d.customer?._id === this.customerFilter);
    }

    if (this.dateFromFilter) {
      const fromDate = new Date(this.dateFromFilter);
      filtered = filtered.filter(d => new Date(d.createdAt) >= fromDate);
    }

    if (this.dateToFilter) {
      const toDate = new Date(this.dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(d => new Date(d.createdAt) <= toDate);
    }

    filtered = this.sortDocuments(filtered);

    this.filteredDocuments = filtered;
    this.totalPages = Math.max(1, Math.ceil(this.filteredDocuments.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updatePaginationInfo();
  }

  sortDocuments(documents: DocumentItem[]): DocumentItem[] {
    return documents.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      aValue = this.getPropertyValue(a, this.sortColumn);
      bValue = this.getPropertyValue(b, this.sortColumn);

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (this.sortColumn === 'createdAt' || this.sortColumn === 'updatedAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
      } else {
        return aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
      }
    });
  }

  getPropertyValue(obj: any, path: string): any {
    const keys = path.split('.');
    return keys.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : null, obj);
  }

  updatePaginationInfo(): void {
    this.paginationStart = (this.currentPage - 1) * this.itemsPerPage;
    this.paginationEnd = Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredDocuments.length
    );
  }

  pageChanged(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginationInfo();
    }
  }

  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filterDocuments();
  }

  exportDocumentsList(): void {
    try {
      const headers = ['Type', 'N° Document', 'N° Commande', 'Client', 'Pharmacie', 'Date création', 'Dernière MAJ'];

      let csvContent = headers.join(',') + '\n';

      this.filteredDocuments.forEach(doc => {
        const row = [
          this.escapeCsvValue(this.getDocumentTypeLabel(doc.type)),
          this.escapeCsvValue(doc.documentNumber),
          this.escapeCsvValue(doc.order?.orderNumber || ''),
          this.escapeCsvValue(doc.customer?.getFullName() || ''),
          this.escapeCsvValue(doc.pharmacy?.name || ''),
          this.escapeCsvValue(doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''),
          this.escapeCsvValue(doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : '')
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `documents_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.handleError('Erreur lors de l\'exportation des données');
    }
  }

  escapeCsvValue(value: string): string {
    if (!value) return '""';
    value = value.replace(/"/g, '""');
    return `"${value}"`;
  }

  viewDocumentDetails(document: DocumentItem): void {
    this.modalService.dismissAll('ok');
    if (document) {
      this.selectedDocument = document;
      setTimeout(() => {
        this.modalService.open(this.documentDetailsModal, {
          size: 'xl',
          backdrop: 'static',
          centered: true
        });
      }, 0);
    }
  }

  // async downloadDocument(document: DocumentItem): Promise<void> {
  //   if (!document.pdfData && !document.htmlData) {
  //     this.handleError('Aucun fichier disponible pour ce document');
  //     return;
  //   }
  //
  //   try {
  //     const token = await this.auth.getRealToken();
  //     const uid = await this.auth.getUid();
  //
  //     if (!token) {
  //       this.handleError('Vous n\'êtes pas autorisé à effectuer cette action');
  //       return;
  //     }
  //
  //     const headers = new HttpHeaders({
  //       'Authorization': `Bearer ${token}`,
  //       'Accept': 'application/json',
  //       'Content-Type': 'application/json'
  //     });
  //
  //     const endpoint = document.type === DocumentType.INVOICE ?
  //       'pharmacy-management/invoices/download' :
  //       'pharmacy-management/bonfiscaux/download';
  //
  //     this.apiService.post(endpoint, {
  //       id: document._id,
  //       uid,
  //       format: 'pdf'
  //     }, headers)
  //       .pipe(takeUntil(this.destroy$))
  //       .subscribe({
  //         next: (response: any) => {
  //           if (response && response.data) {
  //             // Create download link
  //             const blob = new Blob([response.data], { type: 'application/pdf' });
  //             const url = window.URL.createObjectURL(blob);
  //             const link = document.createElement('a');
  //             link.href = url;
  //             link.download = `${document.documentNumber}.pdf`;
  //             link.click();
  //             window.URL.revokeObjectURL(url);
  //           }
  //         },
  //         error: (error) => {
  //           this.handleError('Erreur lors du téléchargement');
  //         }
  //       });
  //   } catch (error) {
  //     this.handleError('Une erreur s\'est produite');
  //   }
  // }

  openAddNoteModal(document: DocumentItem): void {
    this.selectedDocument = document;
    this.addNoteForm = this.createNoteForm();

    this.modalService.dismissAll('ok');
    setTimeout(() => {
      this.modalService.open(this.addNoteModal, {
        size: 'lg',
        backdrop: 'static',
        centered: true
      });
    }, 0);
  }

  async addNote(): Promise<void> {
    if (!this.selectedDocument || !this.addNoteForm.valid) {
      this.handleError("Veuillez remplir tous les champs obligatoires !");
      return;
    }

    try {
      this.isSubmitting = true;
      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();

      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à effectuer cette action');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const endpoint = this.selectedDocument.type === DocumentType.INVOICE ?
        'pharmacy-management/invoices/add-note' :
        'pharmacy-management/bonfiscaux/add-note';

      const formData = {
        id: this.selectedDocument._id,
        note: this.addNoteForm.value.note,
        uid
      };

      this.apiService.post(endpoint, formData, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && !response.error) {
              this.showSuccess('Note ajoutée avec succès');
              this.closeModal();
              this.loadDocuments();
            } else {
              this.handleError(response.errorMessage ?? 'Erreur lors de l\'ajout de la note');
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            this.handleError('Erreur lors de la communication avec le serveur');
            this.isSubmitting = false;
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite. Veuillez réessayer!');
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    this.modalService.dismissAll('ok');
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  private showSuccess(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: message,
      timer: 2000,
      showConfirmButton: false
    });
  }

  async deleteDocument(document: DocumentItem): Promise<void> {
    try {
      const confirmed = await this.showConfirmation(
        'Supprimer le document',
        `Êtes-vous sûr de vouloir supprimer le document "${document.documentNumber}" ? Cette action est irréversible.`,
        'Supprimer'
      );

      if (!confirmed) return;

      const token = await this.auth.getRealToken();
      const uid = await this.auth.getUid();
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à effectuer cette action');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const endpoint = document.type === DocumentType.INVOICE ?
        'pharmacy-management/invoices/delete' :
        'pharmacy-management/bonfiscaux/delete';

      this.apiService.post(endpoint, { id: document._id, uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            const index = this.documents.findIndex(d => d._id === document._id);
            if (index > -1) {
              this.documents.splice(index, 1);
              this.filterDocuments();
              this.showSuccess('Document supprimé avec succès');
            }
          },
          error: (error) => {
            this.handleError('Erreur lors de la suppression du document');
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
    }
  }

  private async showConfirmation(title: string, text: string, confirmButtonText: string): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Annuler'
    });

    return result.isConfirmed;
  }

  getPaginatedDocuments(): DocumentItem[] {
    const start = this.permissions.viewDocuments ? this.paginationStart : 0;
    const end = this.permissions.viewDocuments ? this.paginationEnd : 0;
    return this.filteredDocuments.slice(start, end);
  }

  getPageNumbers(): number[] {
    const result: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        result.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        result.push(i);
      }
    }

    return result;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }

  clearFilters(): void {
    this.searchText = '';
    this.typeFilter = '';
    this.pharmacyFilter = '';
    this.customerFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.filterDocuments();
  }

  // Méthodes utilitaires pour les templates
  getDocumentTypeLabel(type: string): string {
    const typeLabels = {
      'invoice': 'Facture',
      'bon_fiscal': 'Bon Fiscal'
    };
    return typeLabels[type as keyof typeof typeLabels] || 'Inconnu';
  }

  getDocumentTypeBadgeClass(type: string): string {
    const typeClasses = {
      'invoice': 'bg-primary',
      'bon_fiscal': 'bg-success'
    };
    return typeClasses[type as keyof typeof typeClasses] || 'bg-secondary';
  }

  getPeriodLabel(period: string): string {
    const option = this.optionsPeriodDatas.find(opt => opt.value === period);
    return option?.label || 'Période inconnue';
  }

  async setDateIntervalFromPeriod(period: string): Promise<void> {
    this.selectedPeriod = period;
    await this.loadDocuments();
  }

  toggleStatusDropdown(): void {
    this.isPeriodDropdownOpen = !this.isPeriodDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  closeDropdownsOnOutsideClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isPeriodDropdownOpen = false;
    }
  }

  closeDropdown() {
    this.isPeriodDropdownOpen = false;
  }

  async refreshDashboard(): Promise<void> {
    await this.loadDocuments();
  }
}
