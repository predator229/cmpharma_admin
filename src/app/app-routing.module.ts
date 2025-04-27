import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './views/theme/layout/admin/admin.component';
import { GuestComponent } from './views/theme/layout/guest/guest.component';
import { AuthGuard } from './controllers/guards/auth.guard';
import { RoleGuard } from './controllers/guards/role.guard';
import { LoggedInGuard } from './controllers/guards/loggin.guard';


const routes: Routes = [
  // ADMIN AREA
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'manager'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./views/admin/dashboard/dashboard.component').then(c => c.DefaultComponent) },
      // { path: 'pharmacies', loadComponent: () => import('./views/admin/dashboard/dashboard.component').then(c => c.DefaultComponent) },
      // { path: 'pharmacies', loadComponent: () => import('./admin/pharmacies.component').then(c => c.PharmaciesComponent) },
      // { path: 'commandes', loadComponent: () => import('./admin/commandes.component').then(c => c.CommandesComponent) },
      // { path: 'livreurs', loadComponent: () => import('./admin/livreurs.component').then(c => c.LivreursComponent) },
      // { path: 'clients', loadComponent: () => import('./admin/clients.component').then(c => c.ClientsComponent) },
      // { path: 'statistiques', loadComponent: () => import('./admin/statistiques.component').then(c => c.StatistiquesComponent) },
      // { path: 'parametres', loadComponent: () => import('./admin/settings.component').then(c => c.SettingsComponent) },
    ]
  },

  // PHARMACY AREA
  {
    path: 'pharmacy',
    component: AdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['pharmacy'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./views/pharmacy/dashboard/dashboard.component').then(c => c.DefaultComponent) },
      // { path: 'produits', loadComponent: () => import('./pharmacy/produits.component').then(c => c.ProduitsComponent) },
      // { path: 'commandes', loadComponent: () => import('./pharmacy/commandes.component').then(c => c.CommandesComponent) },
      // { path: 'paiements', loadComponent: () => import('./pharmacy/paiements.component').then(c => c.PaiementsComponent) },
      // { path: 'horaires', loadComponent: () => import('./pharmacy/horaires.component').then(c => c.HorairesComponent) },
      // { path: 'geolocalisation', loadComponent: () => import('./pharmacy/geolocalisation.component').then(c => c.GeolocComponent) },
    ]
  },

  // AUTH & GUEST
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: 'login', loadComponent: () => import('./views/login/login.component'), canActivate: [LoggedInGuard] // Ajout du garde pour empêcher l'accès si connecté
      },
      { path: '', loadComponent: () => import('./views/landing/landing.component') },
      { path: 'welcome', loadComponent: () => import('./views/landing/landing.component') },
    ]
  },

  // WILDCARD
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
