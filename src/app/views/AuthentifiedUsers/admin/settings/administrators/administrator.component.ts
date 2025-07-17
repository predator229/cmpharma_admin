// import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
//
// // Interfaces
// interface User {
//   id: string;
//   firstName: string;
//   lastName: string;
//   username: string;
//   email: string;
//   phoneNumber?: string;
//   avatar?: string;
//   role: 'admin' | 'manager' | 'user' | 'moderator';
//   status: 'active' | 'inactive' | 'suspended' | 'pending';
//   permissionGroups: string[];
//   permissions: string[];
//   createdAt: Date;
//   updatedAt: Date;
//   lastLogin?: Date;
//   activityLog?: ActivityLog[];
// }
//
// interface PermissionGroup {
//   id: string;
//   name: string;
//   description: string;
//   permissions: string[];
// }
//
// interface Permission {
//   id: string;
//   name: string;
//   description: string;
// }
//
// interface PermissionCategory {
//   name: string;
//   permissions: Permission[];
// }
//
// interface ActivityLog {
//   date: Date;
//   action: string;
// }
//
// @Component({
//   selector: 'app-user-management',
//   templateUrl: './user-management.component.html',
//   styleUrls: ['./user-management.component.scss']
// })
// export class UserManagementComponent implements OnInit {
//   @ViewChild('userInfoModal') userInfoModal!: TemplateRef<any>;
//   @ViewChild('permissionsModal') permissionsModal!: TemplateRef<any>;
//
//   // Data
//   users: User[] = [];
//   filteredUsers: User[] = [];
//   selectedUser: User | null = null;
//
//   // Filters and search
//   searchText: string = '';
//   roleFilter: string = '';
//   statusFilter: string = '';
//   groupFilter: string = '';
//
//   // Sorting
//   sortField: string = '';
//   sortDirection: 'asc' | 'desc' = 'asc';
//
//   // Pagination
//   currentPage: number = 1;
//   itemsPerPage: number = 10;
//   totalPages: number = 0;
//   paginationStart: number = 0;
//   paginationEnd: number = 0;
//
//   // Modal references
//   private modalRef: NgbModalRef | null = null;
//   private permissionsModalRef: NgbModalRef | null = null;
//
//   // Static data
//   roles: string[] = ['admin', 'manager', 'user', 'moderator'];
//
//   permissionGroups: PermissionGroup[] = [
//     {
//       id: 'admin_group',
//       name: 'Administrateurs',
//       description: 'Accès complet à toutes les fonctionnalités',
//       permissions: ['user_create', 'user_read', 'user_update', 'user_delete', 'pharmacy_manage', 'system_config']
//     },
//     {
//       id: 'manager_group',
//       name: 'Gestionnaires',
//       description: 'Gestion des pharmacies et utilisateurs',
//       permissions: ['user_read', 'user_update', 'pharmacy_manage', 'reports_view']
//     },
//     {
//       id: 'moderator_group',
//       name: 'Modérateurs',
//       description: 'Modération du contenu et support client',
//       permissions: ['user_read', 'pharmacy_read', 'support_manage', 'content_moderate']
//     }
//   ];
//
//   permissionCategories: PermissionCategory[] = [
//     {
//       name: 'Gestion des utilisateurs',
//       permissions: [
//         { id: 'user_create', name: 'Créer utilisateur', description: 'Créer de nouveaux utilisateurs' },
//         { id: 'user_read', name: 'Voir utilisateurs', description: 'Consulter la liste des utilisateurs' },
//         { id: 'user_update', name: 'Modifier utilisateur', description: 'Modifier les informations utilisateurs' },
//         { id: 'user_delete', name: 'Supprimer utilisateur', description: 'Supprimer des utilisateurs' }
//       ]
//     },
//     {
//       name: 'Gestion des pharmacies',
//       permissions: [
//         { id: 'pharmacy_create', name: 'Créer pharmacie', description: 'Ajouter de nouvelles pharmacies' },
//         { id: 'pharmacy_read', name: 'Voir pharmacies', description: 'Consulter la liste des pharmacies' },
//         { id: 'pharmacy_manage', name: 'Gérer pharmacies', description: 'Approuver, suspendre, modifier les pharmacies' },
//         { id: 'pharmacy_delete', name: 'Supprimer pharmacie', description: 'Supprimer des pharmacies' }
//       ]
//     },
//     {
//       name: 'Rapports et statistiques',
//       permissions: [
//         { id: 'reports_view', name: 'Voir rapports', description: 'Accès aux rapports et statistiques' },
//         { id: 'analytics_access', name: 'Analytics', description: 'Accès aux données analytiques avancées' }
//       ]
//     },
//     {
//       name: 'Support et modération',
//       permissions: [
//         { id: 'support_manage', name: 'Support client', description: 'Gérer les tickets de support' },
//         { id: 'content_moderate', name: 'Modération', description: 'Modérer le contenu et les commentaires' }
//       ]
//     },
//     {
//       name: 'Configuration système',
//       permissions: [
//         { id: 'system_config', name: 'Configuration', description: 'Modifier la configuration système' },
//         { id: 'backup_manage', name: 'Sauvegardes', description: 'Gérer les sauvegardes système' }
//       ]
//     }
//   ];
//
//   constructor(
//     private modalService: NgbModal,
//   ) {}
//
//   ngOnInit(): void {
//     this.loadUsers();
//   }
//
//   // Data loading
//   loadUsers(): void {
//     // TODO: Remplacer par un appel API réel
//     this.users = this.generateMockUsers();
//     this.filterUsers();
//   }
//
//   private generateMockUsers(): User[] {
//     return [
//       {
//         id: '1',
//         firstName: 'Jean',
//         lastName: 'Dupont',
//         username: 'jdupont',
//         email: 'jean.dupont@example.com',
//         phoneNumber: '+33123456789',
//         role: 'admin',
//         status: 'active',
//         permissionGroups: ['admin_group'],
//         permissions: ['user_create', 'user_read', 'user_update', 'user_delete'],
//         createdAt: new Date('2024-01-15'),
//         updatedAt: new Date('2024-06-01'),
//         lastLogin: new Date('2024-06-07'),
//         activityLog: [
//           { date: new Date('2024-06-07'), action: 'Connexion au système' },
//           { date: new Date('2024-06-06'), action: 'Modification des permissions utilisateur' }
//         ]
//       },
//       {
//         id: '2',
//         firstName: 'Marie',
//         lastName: 'Martin',
//         username: 'mmartin',
//         email: 'marie.martin@example.com',
//         role: 'manager',
//         status: 'active',
//         permissionGroups: ['manager_group'],
//         permissions: ['user_read', 'pharmacy_manage'],
//         createdAt: new Date('2024-02-20'),
//         updatedAt: new Date('2024-05-28'),
//         lastLogin: new Date('2024-06-06'),
//         activityLog: [
//           { date: new Date('2024-06-06'), action: 'Approbation d\'une pharmacie' }
//         ]
//       }
//     ];
//   }
//
//   // Filtering and searching
//   filterUsers(): void {
//     this.filteredUsers = this.users.filter(user => {
//       const matchesSearch = !this.searchText ||
//         user.firstName.toLowerCase().includes(this.searchText.toLowerCase()) ||
//         user.lastName.toLowerCase().includes(this.searchText.toLowerCase()) ||
//         user.email.toLowerCase().includes(this.searchText.toLowerCase()) ||
//         user.username.toLowerCase().includes(this.searchText.toLowerCase());
//
//       const matchesRole = !this.roleFilter || user.role === this.roleFilter;
//       const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
//       const matchesGroup = !this.groupFilter || user.permissionGroups.includes(this.groupFilter);
//
//       return matchesSearch && matchesRole && matchesStatus && matchesGroup;
//     });
//
//     this.updatePagination();
//   }
//
//   // Sorting
//   sort(field: string): void {
//     if (this.sortField === field) {
//       this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
//     } else {
//       this.sortField = field;
//       this.sortDirection = 'asc';
//     }
//
//     this.filteredUsers.sort((a, b) => {
//       let aValue = this.getFieldValue(a, field);
//       let bValue = this.getFieldValue(b, field);
//
//       if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
//       if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
//       return 0;
//     });
//   }
//
//   private getFieldValue(obj: any, field: string): any {
//     return field.split('.').reduce((o, key) => o?.[key], obj) || '';
//   }
//
//   getSortIcon(field: string): string {
//     if (this.sortField !== field) return 'fa-sort';
//     return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
//   }
//
//   // Pagination
//   updatePagination(): void {
//     this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
//     this.paginationStart = (this.currentPage - 1) * this.itemsPerPage;
//     this.paginationEnd = Math.min(this.paginationStart + this.itemsPerPage, this.filteredUsers.length);
//
//     // Apply pagination to filtered results
//     this.filteredUsers = this.filteredUsers.slice(this.paginationStart, this.paginationEnd);
//   }
//
//   pageChanged(page: number): void {
//     if (page >= 1 && page <= this.totalPages) {
//       this.currentPage = page;
//       this.filterUsers();
//     }
//   }
//
//   getPageNumbers(): number[] {
//     const pages: number[] = [];
//     const start = Math.max(1, this.currentPage - 2);
//     const end = Math.min(this.totalPages, this.currentPage + 2);
//
//     for (let i = start; i <= end; i++) {
//       pages.push(i);
//     }
//     return pages;
//   }
//
//   // User actions
//   viewUserDetails(user: User): void {
//     this.selectedUser = user;
//     this.modalRef = this.modalService.open(this.userInfoModal, { size: 'xl' });
//   }
//
//   editUser(user: User): void {
//     // TODO: Implémenter la modification d'utilisateur
//     this.closeModal();
//   }
//
//   activateUser(user: User): void {
//     user.status = 'active';
//     user.updatedAt = new Date();
//     this.closeModal();
//   }
//
//   suspendUser(user: User): void {
//     user.status = 'suspended';
//     user.updatedAt = new Date();
//     this.closeModal();
//   }
//
//   deleteUser(user: User): void {
//     if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ?`)) {
//       const index = this.users.findIndex(u => u.id === user.id);
//       if (index > -1) {
//         this.users.splice(index, 1);
//         this.filterUsers();
//         this.closeModal();
//       }
//     }
//   }
//
//   resetPassword(user: User): void {
//     // TODO: Implémenter la réinitialisation de mot de passe
//     this.closeModal();
//   }
//
//   // Permission management
//   managePermissions(user: User): void {
//     this.selectedUser = { ...user }; // Create a copy for editing
//     this.closeModal();
//     this.permissionsModalRef = this.modalService.open(this.permissionsModal, { size: 'xl' });
//   }
//
//   isUserInGroup(user: User, groupId: string): boolean {
//     return user.permissionGroups.includes(groupId);
//   }
//
//   toggleUserGroup(user: User, groupId: string, event: any): void {
//     if (event.target.checked) {
//       if (!user.permissionGroups.includes(groupId)) {
//         user.permissionGroups.push(groupId);
//       }
//     } else {
//       const index = user.permissionGroups.indexOf(groupId);
//       if (index > -1) {
//         user.permissionGroups.splice(index, 1);
//       }
//     }
//   }
//
//   hasUserPermission(user: User, permissionId: string): boolean {
//     return user.permissions.includes(permissionId);
//   }
//
//   toggleUserPermission(user: User, permissionId: string, event: any): void {
//     if (event.target.checked) {
//       if (!user.permissions.includes(permissionId)) {
//         user.permissions.push(permissionId);
//       }
//     } else {
//       const index = user.permissions.indexOf(permissionId);
//       if (index > -1) {
//         user.permissions.splice(index, 1);
//       }
//     }
//   }
//
//   saveUserPermissions(): void {
//     if (this.selectedUser) {
//       // Find the original user and update it
//       const originalUser = this.users.find(u => u.id === this.selectedUser!.id);
//       if (originalUser) {
//         originalUser.permissionGroups = [...this.selectedUser.permissionGroups];
//         originalUser.permissions = [...this.selectedUser.permissions];
//         originalUser.updatedAt = new Date();
//       }
//
//       this.closePermissionsModal();
//     }
//   }
//
//   // Modal management
//   closeModal(): void {
//     this.modalRef?.close();
//     this.modalRef = null;
//     this.selectedUser = null;
//   }
//
//   closePermissionsModal(): void {
//     this.permissionsModalRef?.close();
//     this.permissionsModalRef = null;
//     this.selectedUser = null;
//   }
//
//   // Create user
//   openCreateUserModal(): void {
//     // TODO: Implémenter la création d'utilisateur
//     this.toastr.info('Création d\'un nouvel utilisateur', 'À implémenter');
//   }
//
//   // Export
//   exportUsersList(): void {
//     // TODO: Implémenter l'export
//     this.toastr.info('Export de la liste des utilisateurs', 'À implémenter');
//   }
//
//   // Helper methods
//   getRoleLabel(role: string): string {
//     const labels: { [key: string]: string } = {
//       'admin': 'Administrateur',
//       'manager': 'Gestionnaire',
//       'user': 'Utilisateur',
//       'moderator': 'Modérateur'
//     };
//     return labels[role] || role;
//   }
//
//   getStatusLabel(status: string): string {
//     const labels: { [key: string]: string } = {
//       'active': 'Actif',
//       'inactive': 'Inactif',
//       'suspended': 'Suspendu',
//       'pending': 'En attente'
//     };
//     return labels[status] || status;
//   }
//
//   getGroupName(groupId: string): string {
//     const group = this.permissionGroups.find(g => g.id === groupId);
//     return group?.name || groupId;
//   }
//
//   getGroupDescription(groupId: string): string {
//     const group = this.permissionGroups.find(g => g.id === groupId);
//     return group?.description || '';
//   }
//
//   getPermissionLabel(permissionId: string): string {
//     for (const category of this.permissionCategories) {
//       const permission = category.permissions.find(p => p.id === permissionId);
//       if (permission) {
//         return permission.name;
//       }
//     }
//     return permissionId;
//   }
// }
