import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './views/theme/layout/admin/admin.component';
import { PharmacyComponent } from './views/theme/layout/pharmacy/pharmacy.component';
import { GuestComponent } from './views/theme/layout/guest/guest.component';
import { AuthGuard } from './controllers/guards/auth.guard';
import { GroupGuard } from './controllers/guards/group.guard';
import { LoginGuard } from './controllers/guards/login.guard';
import {GroupCode} from "./models/Group.class";
import {PharmacyLogsComponent} from "./views/AuthentifiedUsers/pharmacy/settings/logs/logs.component";

const routes: Routes = [{
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, GroupGuard],
    data: { roles: [GroupCode.MANAGER_ADMIN, GroupCode.ADMIN_TECHNIQUE, GroupCode.SUPPORT_ADMIN, GroupCode.SUPERADMIN] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard/overview', loadComponent: () =>import('./views/AuthentifiedUsers/admin/tableaubord/dashboard/dashboard.component').then((c) => c.AdminDashboardComponent),},
      { path: 'dashboard/stats', loadComponent: () =>import('./views/AuthentifiedUsers/admin/tableaubord/statistiques/statistique.component').then((c) => c.StatisticsComponent),},
      { path: 'dashboard/activity', loadComponent: () =>import('./views/AuthentifiedUsers/admin/tableaubord/recentActivities/recentactivities.component').then((c) => c.RecentactivitiesComponent),},
      { path: 'pharmacies/list',loadComponent: () =>import('./views/AuthentifiedUsers/admin/pharmacies/list/list.component').then((c) => c.PharmacyListComponent), },
      { path: 'pharmacies/:id',  loadComponent: () => import('./views/AuthentifiedUsers/admin/pharmacies/details/details.component').then((c) => c.PharmacyDetailComponent), },
    ],
  },

  // PHARMACY AREA
  {
    path: 'pharmacy',
    component: PharmacyComponent,
    canActivate: [AuthGuard, GroupGuard],
    data: { roles: [GroupCode.MANAGER_PHARMACY, GroupCode.PHARMACIEN, GroupCode.CAISSIER, GroupCode.CONSULTANT, GroupCode.SUPERADMIN] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',loadComponent: () =>import('./views/AuthentifiedUsers/pharmacy/dashboard/dashboard.component').then((c) => c.DefaultComponent), },
      { path: 'pharmacies/list', loadComponent: () =>import('./views/AuthentifiedUsers/pharmacy/pharmacies/list/list.component').then((c) => c.PharmacyListComponentPharmacie), },
      { path: 'pharmacies/:id',  loadComponent: () => import('./views/AuthentifiedUsers/pharmacy/pharmacies/details/details.component').then((c) => c.PharmacyDetailComponentPharmacie), },
      { path: 'admin/logs',  loadComponent: () => import('./views/AuthentifiedUsers/pharmacy/settings/logs/logs.component').then((c) => c.PharmacyLogsComponent), },
      { path: 'admin/logs/:idPharmacy',  loadComponent: () => import('./views/AuthentifiedUsers/pharmacy/settings/logs/logs.component').then((c) => c.PharmacyLogsComponent), },
    ],
  },

  // GUEST AREA (Login, Landing)
  {
    path: '',
    component: GuestComponent,
    // canActivate: [AuthGuard, RoleGuard],
    children: [
      { path: 'login', loadComponent: () => import('./views/NotAuthentifiiedUsers/login/login.component'), canActivate: [LoginGuard], },
      { path: '', loadComponent: () => import('./views/AllUsers/landing/landing.component'), },
      { path: 'welcome', loadComponent: () => import('./views/AllUsers/landing/landing.component'), },
      { path: 'welcome-action', loadComponent: () => import('./views/AllUsers/landing2/landing2.component'), },
      { path: 'become-partner', loadComponent: () => import('./views/NotAuthentifiiedUsers/become_partner/become-partner.component').then((c) => c.BecomePartnerComponent), },
      { path: 'set-password', loadComponent: () => import('./views/NotAuthentifiiedUsers/set-password/set-password.component').then(m => m.SetPasswordComponent) },
      { path: 'not-found', loadComponent: () => import('./views/AuthentifiedUsers/sharedComponents/errors/not-found/not-found.component') },
      { path: 'use-proxy', loadComponent: () => import('./views/AuthentifiedUsers/sharedComponents/errors/use-proxy/use-proxy.component') },

      // { path: 'assets/images/marker-shadow.png' }
    ],
  },

  {
    path: '**',
    redirectTo: 'not-found',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
