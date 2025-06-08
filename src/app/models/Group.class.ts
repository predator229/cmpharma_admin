import {Permission} from "./Permission.class";
import {isArray} from "@angular/compiler-cli/src/ngtsc/annotations/common";

export enum GroupCode {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  PHARMACIST_OWNER = 'pharmacist-owner',
  PHARMACIST_MANAGER = 'pharmacist-manager'
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
    this.code = data.code || GroupCode.MANAGER;
    this.name = data.name || '';
    this.description = data.description || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.plateform = data.plateform || Platform.ADMIN;
    this.createdBy = data.createdBy || 'System';

    if (data.permissions && Array.isArray(data.permissions) && data.permissions.length > 0) {
      this.permissions = data.permissions.map((perm: any) => new Permission(perm));
    } else {
      this.permissions = [];
    }
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    console.log('i created group ok !');
  }
  isGroupActive(): boolean {
    return this.isActive;
  }
}
