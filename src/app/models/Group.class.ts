import {Permission} from "./Permission.class";
import {isArray} from "@angular/compiler-cli/src/ngtsc/annotations/common";

export enum GroupCode {
  SUPERADMIN = 'superadmin',
  MANAGER_ADMIN = 'manager_admin',
  ADMIN_TECHNIQUE = 'admin_technique',
  SUPPORT_ADMIN = 'support_admin',
  MANAGER_PHARMACY = 'manager_pharmacy',
  PHARMACIEN = 'pharmacien',
  PREPARATEUR = 'preparateur',
  CAISSIER = 'caissier',
  CONSULTANT = 'consultant'
}

export enum Platform {
  PHARMACY = 'Pharmacy',
  DELIVER = 'Deliver',
  ADMIN = 'Admin',
}

export interface IGroup {
  _id?: string;
  code: GroupCode;
  name: string;
  description?: string;
  isActive?: boolean;
  plateform: Platform;
  createdBy?: string;
  permissions: Permission[] | String[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Classe Group
export class Group implements IGroup {
  _id?: string;
  code: GroupCode;
  name: string;
  description: string;
  isActive: boolean;
  plateform: Platform;
  createdBy: string;
  permissions: Permission[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<IGroup>) {
    this._id = data._id;
    this.code = data.code || GroupCode.MANAGER_PHARMACY;
    this.name = data.name || '';
    this.description = data.description || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.plateform = data.plateform || Platform.ADMIN;
    this.createdBy = data.createdBy || 'System';

    this.permissions = data.permissions?.map((perm: any) => new Permission(perm)) ?? [];

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
  isGroupActive(): boolean {
    return this.isActive;
  }



}
