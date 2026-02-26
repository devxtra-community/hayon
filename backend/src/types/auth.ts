import { IUserSubscription, IUserUsage, IUserLimits } from "../interfaces/user.interface";

export interface AuthContext {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  timezone: string;
  role: "user" | "admin";
  plan: "free" | "pro";
  subscription: IUserSubscription;
  usage: IUserUsage;
  limits: IUserLimits;
  isDisabled: boolean;
}
