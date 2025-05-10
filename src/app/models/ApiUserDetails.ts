import { Country } from "./Country";
import {SetupBase} from "./SetupBase";

export interface ApiUserDetails{
  error:number,
  user:{
  _id: string;
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
  pharmaciesManaged: string[];
  role: 'superadmin' | 'admin' | 'manager' | 'pharmacist-owner' | 'pharmacits-manager';
  permissions: ('read' | 'write' | 'delete' | 'update')[];
  isActivated: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  setups?: SetupBase,
  },
  message:string,
}
