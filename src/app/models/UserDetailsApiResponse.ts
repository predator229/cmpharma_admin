import {SetupBase} from "./SetupBase";

export interface UserDetailsApiResponse {
  name: string;
  address: string;
  phoneNumber: string;
  profilePicture?: string;  // Optionnel
  setups?: SetupBase,
}
