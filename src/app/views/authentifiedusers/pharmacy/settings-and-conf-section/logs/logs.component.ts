import {Component, OnInit, ViewChild, ElementRef, input, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import { Chart, registerables } from 'chart.js';
import {AuthService} from "../../../../../controllers/services/auth.service";
import {LoadingService} from "../../../../../controllers/services/loading.service";
import {HttpHeaders} from "@angular/common/http";
import {Subject, takeUntil} from "rxjs";
import Swal from "sweetalert2";
import {ApiService} from "../../../../../controllers/services/api.service";
import {ActivityTimelineComponent} from "../../../sharedComponents/activity-timeline/activity-timeline.component";
import {ActivityLoged} from "../../../../../models/Activity.class";
import {CommonFunctions} from "../../../../../controllers/comonsfunctions";
import {PharmacyClass} from "../../../../../models/Pharmacy.class";
import {UserDetails} from "../../../../../models/UserDatails";
import {Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {Category} from "../../../../../models/Category.class";

@Component({
  selector: 'app-pharmacy-logs',
  standalone: true,
  imports: [CommonModule, SharedModule, ActivityTimelineComponent],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
})

export class PharmacyLogsComponent implements OnInit {
  pharmacyId: string[] = [];
  @Input() userDetails: UserDetails | null;
  @Input() zoneRechercheSelected: string = 'pharmacy';
  @Input() userSelected: string = '';

  zoneRechercheArray: Array<{ key: string; name: string }> = [
    {key:'all', name:'Toutes les sections'}, {key:'pharmacy', name: 'Pharmacies'}, {key:'category', name: 'Categories'}, {key:'product', name:'Produits'}
  ];
  zoneRecherche: { [key: string]: { name: string; endpoint: string } } = {
    all: {
      name: 'Toutes les sections',
      endpoint: 'tools/activitiesAll',
    },
    category: {
      name: 'Categories',
      endpoint: 'pharmacy-managment/categories/activities',
    },
    pharmacy: {
      name: 'Pharmacies',
      endpoint: 'pharmacy-managment/pharmacies/activities',
    },
    product: {
      name: 'Produits',
      endpoint: 'pharmacy-management/products/activities',
    },
  };
  searchText: string;
  pharmacyActivities: ActivityLoged[] = [];
  usersInfo: { [key: string]:{  name: string;  img: string;  } } | null = null;
  pharmacies: PharmacyClass[] = [];
  usersArray: Array<{ key: string, name:string}> = [];
  permissions: {
    viewLogs: boolean,
    exportLogs: boolean
  };

  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginationStart: number = 0;
  paginationEnd: number = 0;
  currentPage: number = 1;

  pharmacyActivitiesFilter: ActivityLoged[] = [];

  constructor(private router: Router, private route: ActivatedRoute, private authUser: AuthService, private loadingService: LoadingService, private apiService: ApiService)  {
  }
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(async params => {
      if (params['idPharmacy']) { this.pharmacyId.push(params['idPharmacy']);}
      this.userDetails = params['userDetail'];
      if (!this.userDetails) {
        this.authUser.userDetailsLoaded$
          .pipe(takeUntil(this.destroy$))
          .subscribe(loaded => {
            this.userDetails = this.authUser.getUserDetails();
            this.permissions.viewLogs = this.userDetails.hasPermission('admin_pharmacy.logs.view');
            this.permissions.exportLogs = this.userDetails.hasPermission('admin_pharmacy.export');
            this.userDetails.loadAllPermissions();
            if (this.userDetails?.onlyShowListPharm.length) {
              this.handleError("Une ou plusieurs de vos pharmacies sont en attente de compléments d'informations. Veuillez compléter toutes les informations requises pour poursuivre le processus d'enregistrement.\n");
              window.location.href = "pharmacy/pharmacies/list";
            }
          });
      }

      this.loadPharmacies().then(() => {
        if (this.pharmacyId.length == 0){
          this.pharmacyId = this.pharmacies.map(pharmacy => { return pharmacy.id; })
        }
      });
      console.log(this.pharmacies);

      this.loadPharmacyActivities();
    });
  }

  async loadPharmacies(): Promise<void> {
    this.loadingService.setLoading(true);
    try {
      this.loadingService.setLoading(true);
      const token = await this.authUser.getRealToken();
      const uid = await this.authUser.getUid();
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });
      let listUsers = [{key:'',name:"Tous les utilisateurs"}];
      this.apiService.post('pharmacy-managment/pharmacies/list', { uid, andUsersList:1 }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.pharmacies = response.data.map((item: any) => CommonFunctions.mapToPharmacy(item));
              response.usersArray.forEach((item: any) => listUsers.push(item));
              this.usersArray = listUsers;
            } else {
              this.pharmacies = [];
              this.usersArray = [];
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des pharmacies');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produiteee');
      this.loadingService.setLoading(false);
    }
  }
  async loadPharmacyActivities(): Promise<void> {
    if ( typeof this.zoneRecherche[this.zoneRechercheSelected] === 'undefined') {
      this.handleError('Option selectionne invalide!');
      return;
    }

    const endpoint = this.zoneRecherche[this.zoneRechercheSelected].endpoint;
    const user_ = this.userSelected;
    const token = await this.authUser.getRealToken();
    const uid = await this.authUser.getUid();
    if (!token) {
      this.handleError('Vous n\'êtes pas autorisé à effectuer cette action');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    const pharmacyId = this.pharmacyId;
    const all = 1;
    this.apiService.post(endpoint, { uid, id:pharmacyId, all, user_ }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && !response.error && response.data){
            this.pharmacyActivities = response?.data || [];
            this.usersInfo = response?.usersMap || [];
            this.filterLogs();
          }else{
            this.handleError( response.message ?? (response.errorMessage ?? `Erreur lors du chargement des logs d'activites`));
          }
        },
        error: (error) => {
          this.pharmacyActivities = [];
          this.handleError(`Erreur lors du chargement des logs d'activites`);
        }
      });
  }

  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  filterLogs(): void {
    let filtered = [...this.pharmacyActivities];

    if (this.searchText) {
      const searchTerms = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.author?.toLowerCase().includes(searchTerms) ||
        c.description?.toLowerCase().includes(searchTerms) ||
        c.type?.toLowerCase().includes(searchTerms) ||
        c.title?.toLowerCase().includes(searchTerms)
      );
    }

    this.pharmacyActivitiesFilter = filtered;
    this.totalPages = Math.max(1, Math.ceil(this.pharmacyActivitiesFilter.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updatePaginationInfo();
  }
  updatePaginationInfo(): void {
    this.paginationStart = (this.currentPage - 1) * this.itemsPerPage;
    this.paginationEnd = Math.min(
      this.currentPage * this.itemsPerPage,
      this.pharmacyActivitiesFilter.length
    );
  }
  getPaginatedCategories(): ActivityLoged[] {
    const start = this.permissions.viewLogs ? this.paginationStart : 0;
    const end = this.permissions.viewLogs ? this.paginationEnd : 0;
    return this.pharmacyActivitiesFilter.slice(start, end);
  }
}
