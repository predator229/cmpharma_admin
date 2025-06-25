import { Country } from "./Country";
import {SetupBase} from "./SetupBase";
import {Group} from "./Group.class";

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
  groups: Group[];
  isActivated: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  setups?: SetupBase,
  },
  onlyShowListPharm? : boolean;
  message:string,
}
