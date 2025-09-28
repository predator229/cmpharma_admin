import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import {InvoiceNote} from "../../../../../../models/Invoice.class";
import {BonFiscaleNote} from "../../../../../../models/BonFiscal.class";
import {Admin} from "../../../../../../models/Admin.class";

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
  notes?: InvoiceNote[] | BonFiscaleNote[];
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
    { value: '1d', label: 'Aujourd\'hui' },
    { value: '30d', label: '30 derniers jours' },
    { value: '3m', label: '3 derniers mois' },
    { value: '6m', label: '6 derniers mois' },
    { value: '1y', label: 'Depuis le debut d\'anee' },
    { value: '1yfull', label: '1 an' },
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
  blobPreview: Blob | null = null;
  private currentBlobUrl: string | null = null;

  @ViewChild('documentDetailsModal') documentDetailsModal: ElementRef | undefined;
  @ViewChild('addNoteModal') addNoteModal: ElementRef | undefined;

  userDetail: UserDetails;
  baseUrl = environment.baseUrl;
  pharmaciesListArray: Array<{value: string, label: string}> = [];
  customersListArray: Array<{value: string, label: string}> = [];
  selectedPeriod: string = '30d';
  currentSafeBlobUrl?: SafeResourceUrl;

  constructor(
    modalService: NgbModal,
    private sanitizer: DomSanitizer,
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
        this.permissions.viewDocuments = this.userDetail.hasPermission('commandes.view');
        this.permissions.generateDocuments = this.userDetail.hasPermission('commandes.assign');
        this.permissions.deleteDocuments = this.userDetail.hasPermission('commandes.assign');
        this.permissions.exportDocuments = this.userDetail.hasPermission('commandes.print');
        this.permissions.downloadDocuments = this.userDetail.hasPermission('commandes.checkout');

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
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
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
        this.loadingService.setLoading(false);
        return;
      }

      this.apiService.post('pharmacy-management/orders/document/list', { uid, period: this.selectedPeriod }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.documents = this.processDocuments(response.data);
              this.filterDocuments();
              this.pharmaciesListArray = response.pharmaciesList.map(pharmacy => {
                return {
                  value: pharmacy._id,
                  label: pharmacy.name
                }
              }) ?? [];
              this.customersListArray = response.customersList.map(customer => {
                return {
                  value: customer._id,
                  label: customer.email
                }
              }) ?? [];
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

    if (Array.isArray(data)) {
      data.forEach((doc: any) => {
        documents.push({
          _id: doc._id,
          type: doc.type === 'invoice' ? DocumentType.INVOICE : DocumentType.BON_FISCAL,
          documentNumber: doc.documentNumber,
          order: doc.orderId ? { _id: doc.orderId, orderNumber: doc.orderNumber } as any : undefined,
          customer: doc.customer ? new CustomerClass(doc.customer) : undefined,
          pharmacy: doc.pharmacy ? new PharmacyClass(doc.pharmacy) : undefined,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
          pdfData: doc.pdfData ?? undefined,
          htmlData: doc.htmlData ?? undefined,
          notes: doc.type === 'invoice' ? doc.notes.map((note) => {
            return {
              note: note.note,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
              from: new Admin(note.from),
            } as InvoiceNote;
          }) : doc.notes.map((note) => {
            return{
              note: note.note,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
              from: new Admin(note.from),
            } as BonFiscaleNote;
          }),
          generations: doc.generatedBy ? [{
            generatedBy: doc.generatedBy,
            generatedAt: doc.generatedAt
          }] : []
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

      const formData = {
        type_: this.selectedDocument.type.toLowerCase().replace('_', ''),
        id: this.selectedDocument._id,
        note: this.addNoteForm.value.note,
        uid
      };

      this.apiService.post('pharmacy-management/orders/document/add-note', formData, headers)
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
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    this.blobPreview = null;
    this.selectedDocument = null;
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

  viewDocumentDetails(document: DocumentItem,  isView=true): void {
    const documentType = document.type;

    if (document.htmlData || document.pdfData ) {
      if (document.pdfData) {
        this.blobPreview = this.handlePdfData(document.pdfData);
        if (this.blobPreview) {
          if (isView) {
            this.getBlobPreviewUrl();
            this.selectedDocument = document;
            setTimeout(() => {
              this.modalService.open(this.documentDetailsModal, {
                size: 'xl',
                backdrop: 'static',
                centered: true
              });
            }, 0);
          }else{
            this.downloadFile();
          }
        }

      } else if (document.htmlData) {
        this.handleHtmlData(document.htmlData, isView);
      }
    } else {
      const htmlData = document.htmlData;

      if (htmlData) {
        this.handleHtmlData(htmlData,isView);
      } else {
        this.showDocumentNotAvailableMessage(documentType);
      }
    }
  }

  private handlePdfData(bufferData: any): Blob | null {

    try {
      let pdfBuffer: ArrayBuffer;

      if (typeof bufferData === 'string') {
        const binaryString = atob(bufferData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfBuffer = bytes.buffer;
      } else if (bufferData?.$binary?.base64) {
        const base64Data = bufferData.$binary.base64;

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfBuffer = bytes.buffer;
      } else if (bufferData instanceof ArrayBuffer) {
        pdfBuffer = bufferData;
      } else {
        return null;
      }

      if (pdfBuffer.byteLength === 0) {
        return null;
      }

      return new Blob([pdfBuffer], { type: 'application/pdf' });
    } catch (error) {
      return null;
    }
  }

  private handleHtmlData(htmlData: string, isView?:boolean): void {
    try {
      if (!htmlData || htmlData.length === 0) {
    return;
  }

  if (!htmlData.includes('<html') && !htmlData.includes('<!DOCTYPE')) {
  }

  const blob = new Blob([htmlData], { type: 'text/html;charset=utf-8' });

  const url = URL.createObjectURL(blob);

  if (isView){
    window.open(url, '_blank');
  }else{
    this.showHtmlInModal(htmlData);
  }

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 5000);

  } catch (error) {
  }
  }

  private downloadFile(): void {
    if (!this.blobPreview) {
      return;
    }
    const url = URL.createObjectURL(this.blobPreview);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_preview_${Date.now().toString().replace(' ', '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private showHtmlInModal(htmlData: string): void {

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const content = document.createElement('div');
    content.style.backgroundColor = 'white';
    content.style.width = '90%';
    content.style.height = '90%';
    content.style.position = 'relative';
    content.style.overflow = 'auto';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => document.body.removeChild(modal);

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.srcdoc = htmlData;

    content.appendChild(closeBtn);
    content.appendChild(iframe);
    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  private showDocumentNotAvailableMessage(documentType: string): void {
    alert(`Document ${documentType} non disponible`);
  }

  getBlobPreviewUrl(): void {
    if (this.blobPreview) {
      if (this.currentBlobUrl) {
        URL.revokeObjectURL(this.currentBlobUrl);
      }

      this.currentBlobUrl = URL.createObjectURL(this.blobPreview);
      this.currentSafeBlobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl);
    } else {
      this.currentSafeBlobUrl = undefined;
    }
  }
}
