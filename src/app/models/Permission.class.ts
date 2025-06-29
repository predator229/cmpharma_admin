// Interface pour le document Permission
import {Platform} from "./Group.class";

export interface IPermission {
  _id?: string;
  module: string;
  label?: string;
  permissions: string[];
  plateform: Platform;
  description?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Classe Permission
export class Permission implements IPermission {
  _id?: string;
  module: string;
  permissions: string[];
  label?: string;
  plateform: Platform;
  description: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<IPermission>) {
    this._id = data._id;
    this.module = data.module || '';
    this.label = data.label || '';
    this.permissions = data.permissions.map((perm: any) => perm.toString()) || [];
    this.plateform = data.plateform || Platform.ADMIN;
    this.description = data.description || '';
    this.createdBy = data.createdBy || 'System';
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isValidModule(): boolean {
    return this.module.trim().length > 0;
  }

  addPermission(permission: string): void {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
    }
  }

  removePermission(permission: string): void {
    const index = this.permissions.indexOf(permission);
    if (index > -1) {
      this.permissions.splice(index, 1);
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  toObject(): IPermission {
    return {
      _id: this._id,
      module: this.module,
      permissions: [...this.permissions],
      plateform: this.plateform,
      description: this.description,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromObject(data: IPermission): Permission {
    return new Permission(data);
  }
}

export type CreatePermissionDto = Omit<IPermission, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdatePermissionDto = Partial<Omit<IPermission, '_id' | 'createdAt' | 'updatedAt'>>;
