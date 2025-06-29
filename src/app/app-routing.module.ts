import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './views/theme/layout/admin/admin.component';
import { PharmacyComponent } from './views/theme/layout/pharmacy/pharmacy.component';
import { GuestComponent } from './views/theme/layout/guest/guest.component';
import { AuthGuard } from './controllers/guards/auth.guard';
import { GroupGuard } from './controllers/guards/group.guard';
import { LoginGuard } from './controllers/guards/login.guard';
import {GroupCode} from "./models/Group.class";

const routes: Routes = [{
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, GroupGuard],
    data: { roles: [GroupCode.MANAGER_ADMIN, GroupCode.ADMIN_TECHNIQUE, GroupCode.SUPPORT_ADMIN, GroupCode.SUPERADMIN] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard/overview', loadComponent: () =>import('./views/admin/tableaubord/dashboard/dashboard.component').then((c) => c.AdminDashboardComponent),},
      { path: 'dashboard/stats', loadComponent: () =>import('./views/admin/tableaubord/statistiques/statistique.component').then((c) => c.StatisticsComponent),},
      { path: 'dashboard/activity', loadComponent: () =>import('./views/admin/tableaubord/recentActivities/recentactivities.component').then((c) => c.RecentactivitiesComponent),},
      { path: 'pharmacies/list',loadComponent: () =>import('./views/admin/pharmacies/list/list.component').then((c) => c.PharmacyListComponent), },
      { path: 'pharmacies/:id',  loadComponent: () => import('./views/admin/pharmacies/details/details.component').then((c) => c.PharmacyDetailComponent), },
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
      { path: 'dashboard',loadComponent: () =>import('./views/pharmacy/dashboard/dashboard.component').then((c) => c.DefaultComponent), },
      { path: 'pharmacies/list', loadComponent: () =>import('./views/pharmacy/pharmacies/list/list.component').then((c) => c.PharmacyListComponentPharmacie), },
      { path: 'pharmacies/:id',  loadComponent: () => import('./views/pharmacy/pharmacies/details/details.component').then((c) => c.PharmacyDetailComponentPharmacie), },
    ],
  },

  // GUEST AREA (Login, Landing)
  {
    path: '',
    component: GuestComponent,
    // canActivate: [AuthGuard, RoleGuard],
    children: [
      { path: 'login', loadComponent: () => import('./views/login/login.component'), canActivate: [LoginGuard], },
      { path: '', loadComponent: () => import('./views/landing/landing.component'), },
      { path: 'welcome', loadComponent: () => import('./views/landing/landing.component'), },
      { path: 'welcome-action', loadComponent: () => import('./views/landing2/landing2.component'), },
      { path: 'become-partner', loadComponent: () => import('./views/become_partner/become-partner.component').then((c) => c.BecomePartnerComponent), },
      { path: 'set-password', loadComponent: () => import('./views/set-password/set-password.component').then(m => m.SetPasswordComponent) },
      { path: 'not-found', loadComponent: () => import('./views/errors/not-found/not-found.component') },
      { path: 'use-proxy', loadComponent: () => import('./views/errors/use-proxy/use-proxy.component') },
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
