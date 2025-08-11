import {Component, Input, input, OnInit} from '@angular/core';
import { formatDistanceToNow } from 'date-fns';
import {FileClass} from "../../../../models/File.class";
import {fr} from "date-fns/locale/fr";
import {FormsModule} from "@angular/forms";
import {ActivityLoged} from "../../../../models/Activity.class";
import {CommonModule} from "@angular/common";
import {environment} from "../../../../../environments/environment";

@Component({
  selector: 'files-preview-component',
  templateUrl: './files-preview.component.html',
  imports: [
    FormsModule,
    CommonModule
  ],
  styleUrls: ['./files-preview.component.scss']
})
export class FilesPreviewComponent implements OnInit {
  // Données brutes
  @Input() allAttachements: FileClass[] = [];
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() selectedFileType: string = '';
  @Input() sortBy: string = 'date';
  @Input() searchTerm: string = '';

  // Sélection de fichiers
  selectedFiles: FileClass[] = [];

  // États de chargement
  isLoading: boolean = false;
  isClearing: boolean = false;
  loadingFiles: Map<string, number> = new Map(); // fileId -> % progression
  internatPathUrl = environment.internalPathUrl;

  // Cache pour les fichiers filtrés
  private filteredFiles: FileClass[] = [];

  ngOnInit(): void {
    this.filteredFiles = [...this.allAttachements];
    this.sortFiles();
    const savedViewMode = localStorage.getItem('attachments-view-mode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      this.viewMode = savedViewMode;
    }
    this.filterFiles();
  }

  /**
   * Définit le mode d'affichage
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    localStorage.setItem('attachments-view-mode', mode);
  }

  /**
   * Filtre les fichiers selon les critères
   */
  filterFiles(): void {
    let filtered = [...this.allAttachements];

    // Filtre par type
    if (this.selectedFileType) {
      filtered = filtered.filter(file => {
        switch (this.selectedFileType) {
          case 'image':
            return ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(file.extension);
          case 'document':
            return ['doc', 'dox', 'txt', 'pdf', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(file.extension);
          case 'archive':
            return ['zip', 'rar', '7z'].includes(file.extension);
          case 'other':
            return !['jpeg', 'jpg', 'png', 'gif', 'webp','doc', 'dox', 'txt', 'pdf', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'json', 'xml', 'html', 'css', 'js', 'ts', 'zip', 'rar', '7z'].includes(file.extension);
          default:
            return true;
        }
      });
    }

    // Filtre par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(file =>
        file.originalName.toLowerCase().includes(term) ||
        file.uploadedBy?.name?.toLowerCase().includes(term) ||
        file.uploadedBy?.email?.toLowerCase().includes(term) ||
        (file.tags && file.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    this.filteredFiles = filtered;
    this.sortFiles();
  }

  /**
   * Trie les fichiers
   */
  sortFiles(): void {
    this.filteredFiles.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName);
        case 'size':
          const sizeA = typeof a.fileSize === 'string' ? parseInt(a.fileSize) : a.fileSize;
          const sizeB = typeof b.fileSize === 'string' ? parseInt(b.fileSize) : b.fileSize;
          return sizeB - sizeA;
        case 'type':
          return a.fileType.localeCompare(b.fileType);
        case 'date':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        default:
          return 0;
      }
    });
  }

  getFilteredFiles(): FileClass[] {
    if (this.filteredFiles.length === 0 && this.allAttachements.length > 0) {
      this.filterFiles();
    }
    return this.filteredFiles;
  }

  resetFilters(): void {
    this.selectedFileType = '';
    this.sortBy = 'name';
    this.searchTerm = '';
    this.filterFiles();
  }

  /**
   * Sélection unique
   */
  isFileSelected(file: FileClass): boolean {
    return this.selectedFiles.some(f => f._id === file._id);
  }

  toggleFileSelection(file: FileClass, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.isFileSelected(file)) {
        this.selectedFiles.push(file);
      }
    } else {
      this.selectedFiles = this.selectedFiles.filter(f => f._id !== file._id);
    }
  }

  /**
   * Sélection globale
   */
  areAllFilesSelected(): boolean {
    return this.selectedFiles.length > 0 &&
      this.selectedFiles.length === this.getFilteredFiles().length;
  }

  areSomeFilesSelected(): boolean {
    return this.selectedFiles.length > 0 &&
      this.selectedFiles.length < this.getFilteredFiles().length;
  }

  toggleAllFiles(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedFiles = [...this.getFilteredFiles()];
    } else {
      this.selectedFiles = [];
    }
  }

  /**
   * Téléchargement
   */
  downloadFile(file: FileClass): void {
    const link = document.createElement('a');
    link.href = this.getFileUrl(file);
    link.download = file.originalName;
    link.click();
  }

  downloadSelectedFiles(): void {
    this.selectedFiles.forEach(file => this.downloadFile(file));
  }

  /**
   * Suppression
   */
  removeFile(file: FileClass, index: number): void {
    this.allAttachements = this.allAttachements.filter(f => f._id !== file._id);
    this.selectedFiles = this.selectedFiles.filter(f => f._id !== file._id);
    this.filterFiles();
  }

  removeSelectedFiles(): void {
    this.selectedFiles.forEach(file => {
      this.allAttachements = this.allAttachements.filter(f => f._id !== file._id);
    });
    this.selectedFiles = [];
    this.filterFiles();
  }

  clearFiles(): void {
    this.isClearing = true;
    setTimeout(() => {
      this.allAttachements = [];
      this.selectedFiles = [];
      this.filteredFiles = [];
      this.isClearing = false;
    }, 1000);
  }

  /**
   * Prévisualisation
   */
  openFilePreview(file: FileClass): void {
    window.open(this.getFileUrl(file), '_blank');
  }

  canPreviewFile(file: FileClass): boolean {
    return ['jpeg', 'jpg', 'png', 'gif', 'webp', 'doc', 'dox', 'txt', 'pdf', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(file.extension);
  }

  /**
   * Helpers fichiers
   */

  getFileUrl(file: FileClass): string {
    return `${this.internatPathUrl+file.url}`;
  }

  getPdfPreviewUrl(file: FileClass): string {
    return this.internatPathUrl+file.url + '#toolbar=0';
  }
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


  getFormattedFileSize(size: number | string): string {
    const s = typeof size === 'string' ? parseInt(size, 10) : size;
    if (s < 1024) return `${s} o`;
    if (s < 1024 * 1024) return `${(s / 1024).toFixed(1)} Ko`;
    return `${(s / (1024 * 1024)).toFixed(1)} Mo`;
  }

  getFileTypeLabel(type: string): string {
    if (['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(type)) { return  'Image'; }
    if (type === 'pdf') { return 'PDF'; }
    if (['doc', 'dox', 'txt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(type)) { return 'Document';}
    if (['zip', 'rar', '7z'].includes(type)) { return 'Archive';}
    return 'Autre';
  }

  formatRelativeDate(date: string | Date): string {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  }

  isFileExpiringSoon(expiresAt?: string | Date): boolean {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000; // Moins de 3 jours
  }

  isFileLoading(fileId: string): boolean {
    return this.loadingFiles.has(fileId);
  }

  getFileProgress(fileId: string): number {
    return this.loadingFiles.get(fileId) || 0;
  }

  onImageError(event: Event, file: FileClass): void {
    (event.target as HTMLImageElement).src = '/assets/images/file-placeholder.png';
  }

  shareFile(file: FileClass): void {
    const shareUrl = this.getFileUrl(file);
    navigator.clipboard.writeText(shareUrl);
    alert('Lien copié dans le presse-papiers');
  }
}
