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

  prePage: string = '50';
  pharmacyActivities: ActivityLoged[] = [];
  usersInfo: { [key: string]:{  name: string;  img: string;  } } | null = null;
  pharmacies: PharmacyClass[] = [];

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

      this.apiService.post('pharmacy-managment/pharmacies/list', { uid }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              this.pharmacies = response.data.map((item: any) => CommonFunctions.mapToPharmacy(item));
            } else {
              this.pharmacies = [];
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
    const token = await this.authUser.getRealToken();
    const uid = await this.authUser.getUid();
    const prePage = parseInt(this.prePage);
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
    this.apiService.post('managers/pharmacies/activities', { uid, prePage, id:pharmacyId }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && !response.error && response.data){
            this.pharmacyActivities = response?.data || [];
            this.usersInfo = response?.usersMap || [];
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

  getActivityIcon(type: string): string {
    switch (type) {
      case 'order':
        return 'fas fa-shopping-cart';
      case 'pharmacy':
        return 'fas fa-clinic-medical';
      case 'payment':
        return 'fas fa-euro-sign';
      case 'user':
        return 'fas fa-user';
      case 'delivery':
        return 'fas fa-truck';
      default:
        return 'fas fa-info-circle';
    }
  }

}
