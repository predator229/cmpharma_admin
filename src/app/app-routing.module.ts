import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './views/theme/layout/admin/admin.component';
import { PharmacyComponent } from './views/theme/layout/pharmacy/pharmacy.component';
import { GuestComponent } from './views/theme/layout/guest/guest.component';
import { AuthGuard } from './controllers/guards/auth.guard';
import { GroupGuard } from './controllers/guards/group.guard';
import { LoginGuard } from './controllers/guards/login.guard';
import {GroupCode} from "./models/Group.class";
import {PharmacyUserDetailComponent} from "./views/authentifiedusers/pharmacy/users/user/user.component";
import {
  PharmacyInternalMessagingComponent
} from "./views/authentifiedusers/pharmacy/settings/messagerie/messagerie.component";

const routes: Routes = [{
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, GroupGuard],
    data: { roles: [GroupCode.MANAGER_ADMIN, GroupCode.ADMIN_TECHNIQUE, GroupCode.SUPPORT_ADMIN, GroupCode.SUPERADMIN] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard/overview', loadComponent: () =>import('./views/authentifiedusers/admin/tableaubord/dashboard/dashboard.component').then((c) => c.AdminDashboardComponent),},
      { path: 'dashboard/stats', loadComponent: () =>import('./views/authentifiedusers/admin/tableaubord/statistiques/statistique.component').then((c) => c.StatisticsComponent),},
      { path: 'dashboard/activity', loadComponent: () =>import('./views/authentifiedusers/admin/tableaubord/recentActivities/recentactivities.component').then((c) => c.RecentactivitiesComponent),},
      { path: 'pharmacies/list',loadComponent: () =>import('./views/authentifiedusers/admin/pharmacies/list/list.component').then((c) => c.PharmacyListComponent), },
      { path: 'pharmacies/:id',  loadComponent: () => import('./views/authentifiedusers/admin/pharmacies/details/details.component').then((c) => c.PharmacyDetailComponent), },
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
      { path: 'dashboard',loadComponent: () =>import('./views/authentifiedusers/pharmacy/dashboard/dashboard.component').then((c) => c.DefaultComponent), },

      { path: 'pharmacies/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/pharmacies/list/list.component').then((c) => c.PharmacyListComponentPharmacie), },
      { path: 'pharmacies/:id',  loadComponent: () => import('./views/authentifiedusers/pharmacy/pharmacies/details/details.component').then((c) => c.PharmacyDetailComponentPharmacie), },

      { path: 'categories/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/categories/list/list.component').then((c) => c.PharmacyCategoryListComponent), },
      { path: 'categories/:id',  loadComponent: () => import('./views/authentifiedusers/pharmacy/categories/category/category.component').then((c) => c.PharmacyCategoryDetailComponent), },

      { path: 'products/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/products/list/products.component').then((c) => c.PharmacyProductListComponent), },
      { path: 'products/:id',  loadComponent: () => import('./views/authentifiedusers/pharmacy/products/product/product.component').then((c) => c.PharmacyProductDetailComponent), },

      { path: 'users/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/users/list/users.component').then((c) => c.PharmacyUsersListComponent), },
      { path: 'users/:id', loadComponent: () =>import('./views/authentifiedusers/pharmacy/users/user/user.component').then((c) => c.PharmacyUserDetailComponent), },

      { path: 'users/permissions', loadComponent: () =>import('./views/authentifiedusers/pharmacy/permissions/list/permissions.component').then((c) => c.PharmacyPermissionsManagementComponent), },

      { path: 'admin/logs',  loadComponent: () => import('./views/authentifiedusers/pharmacy/settings/logs/logs.component').then((c) => c.PharmacyLogsComponent), },
      { path: 'admin/logs/:idPharmacy',  loadComponent: () => import('./views/authentifiedusers/pharmacy/settings/logs/logs.component').then((c) => c.PharmacyLogsComponent), },

      { path: 'messaging',  loadComponent: () => import('./views/authentifiedusers/pharmacy/settings/messagerie/messagerie.component').then((c) => c.PharmacyInternalMessagingComponent), },

    ],
  },

  // GUEST AREA (Login, Landing)
  {
    path: '',
    component: GuestComponent,
    // canActivate: [AuthGuard, RoleGuard],
    children: [
      { path: 'login', loadComponent: () => import('./views/notauthentifiedusers/login/login.component'), canActivate: [LoginGuard], },
      { path: '', loadComponent: () => import('./views/allusers/landing/landing.component'), },
      { path: 'welcome', loadComponent: () => import('./views/allusers/landing/landing.component'), },
      { path: 'welcome-action', loadComponent: () => import('./views/allusers/landing2/landing2.component'), },
      { path: 'become-partner', loadComponent: () => import('./views/notauthentifiedusers/become_partner/become-partner.component').then((c) => c.BecomePartnerComponent), },
      { path: 'set-password', loadComponent: () => import('./views/notauthentifiedusers/set-password/set-password.component').then(m => m.SetPasswordComponent) },
      { path: 'not-found', loadComponent: () => import('./views/authentifiedusers/sharedComponents/errors/not-found/not-found.component') },
      { path: 'use-proxy', loadComponent: () => import('./views/authentifiedusers/sharedComponents/errors/use-proxy/use-proxy.component') },

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
