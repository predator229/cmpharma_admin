import { ApiUserDetails } from "./ApiUserDetails";
import { Country } from "./Country";
import {SetupBase} from "./SetupBase";
import {Permission} from "./Permission.class";
import {OpeningHoursClass} from "./OpeningHours.class";
import {Group} from "./Group.class";

export class UserDetails {
  groups: Group[];
  id: string;
  email: string;
  name?: string;
  surname?: string;
  photoURL?: string;
  disabled: boolean;
  country?: Country;
  city?: string;
  address?: string;
  mobils?: string[];
  phone?: string;
  setups?: SetupBase;
  pharmaciesManaged: string[];
  isActivated: boolean;
  onlyShowListPharm?: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  allpermissions?: string[];

  constructor(data: {
    id: string;
    email: string;
    name: string;
    surname: string;
    photoURL?: string;
    disabled?: boolean;
    country?: Country;
    city?: string;
    address?: string;
    mobils?: string[];
    phone?: string;
    setups?: SetupBase;
    pharmaciesManaged?: string[];
    groups: Group[];
    permissions?: Permission[] | [String];
    isActivated?: boolean;
    lastLogin?: Date | null;
    onlyShowListPharm?: boolean;
    createdAt: Date;
    updatedAt: Date;
    allpermissions?: string[];
  }) {
    this.groups = data.groups ? data.groups.map((group: any) => new Group(group)) : [];
    this.id = data.id || '';
    this.email = data.email || '';
    this.name = data.name || '';
    this.surname = data.surname || '';
    this.photoURL = data.photoURL || '';
    this.disabled = data.disabled || false;
    this.country = data.country;
    this.city = data.city || '';
    this.address = data.address || '';
    this.mobils = data.mobils || [];
    this.setups = data.setups ?? null;
    this.phone = data.phone || '';
    this.pharmaciesManaged = data.pharmaciesManaged || [];
    this.isActivated = data.isActivated !== undefined ? data.isActivated : true;
    this.onlyShowListPharm = data.onlyShowListPharm || false;
    this.lastLogin = data.lastLogin || null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    this.loadAllPermissions();
  }

  static fromApiResponse(data: ApiUserDetails): UserDetails {
    return new UserDetails({
      id: data.user._id,
      email: data.user.email,
      name: data.user.name,
      surname: data.user.surname,
      photoURL: data.user.photoURL,
      disabled: data.user.disabled,
      country: data.user.country,
      city: data.user.city,
      address: data.user.address,
      mobils: data.user.mobils,
      phone: data.user.phone,
      setups: data.user.setups ?? null,
      pharmaciesManaged: data.user.pharmaciesManaged,
      groups: data.user.groups ? data.user.groups.map((group: any) => new Group(group)) : [],
      onlyShowListPharm: data?.onlyShowListPharm || false,
      isActivated: data.user.isActivated,
      lastLogin: data.user.lastLogin,
      createdAt: new Date(data.user.createdAt),
      updatedAt: new Date(data.user.updatedAt),
    });
  }

  loadAllPermissions(): void {
    const allPermissionsSet = new Set<string>();
    this.groups
      .filter(group => group.isGroupActive())
      .forEach(group => {
        group.permissions.forEach(permission => {
          permission.permissions.forEach(perm => {
            allPermissionsSet.add(perm);
          });
        });
      });
    this.allpermissions = this.onlyShowListPharm ? ['pharmacies.view'] : Array.from(allPermissionsSet).sort();
  }

  hasPermission(permission: string): boolean {
    return this.allpermissions?.includes(permission) || false;
  }

  hasPermissions(permissions: string[]): boolean {
    if (!this.allpermissions || !Array.isArray(permissions)) {
      return false;
    }
    // return false;
    return permissions.every(permission => this.allpermissions!.includes(permission));
  }

  hasAnyPermission(permissions: string[]): boolean {
    if (!this.allpermissions || !Array.isArray(permissions)) {
      return false;
    }
    return permissions.some(permission => this.allpermissions!.includes(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    if (!this.allpermissions || !Array.isArray(permissions)) {
      return false;
    }
    return permissions.every(permission => this.allpermissions!.includes(permission));
  }

  getPermissionsByModule(module: string): string[] {
    if (!this.allpermissions) { return []; }

    const modulePermissions = new Set<string>();

    this.groups
      .filter(group => group.isGroupActive())
      .forEach(group => {
        group.permissions
          .filter(permission => permission.module === module)
          .forEach(permission => {
            permission.permissions.forEach(perm => {
              if (this.allpermissions!.includes(perm)) {
                modulePermissions.add(perm);
              }
            });
          });
      });

    return Array.from(modulePermissions).sort();
  }

  refreshPermissions(): void {
    this.loadAllPermissions();
  }

  getPermissionStats(): {
    totalPermissions: number;
    groupsCount: number;
    activeGroupsCount: number;
    moduleCount: number;
  } {
    const modules = new Set<string>();

    this.groups
      .filter(group => group.isGroupActive())
      .forEach(group => {
        group.permissions.forEach(permission => {
          modules.add(permission.module);
        });
      });

    return {
      totalPermissions: this.allpermissions?.length || 0,
      groupsCount: this.groups.length,
      activeGroupsCount: this.groups.filter(group => group.isGroupActive()).length,
      moduleCount: modules.size
    };
  }
  canAccessNavigationItem(permissions: string[] | undefined): boolean {
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return true;
    }
    if (!this.allpermissions || this.allpermissions.length === 0) {
      return false;
    }
    return ['pharmacy', 'admin'].some(plateforme => permissions.some(permission => this.allpermissions!.includes(plateforme+'.'+permission) || this.allpermissions!.includes(permission) ));
  }
}
