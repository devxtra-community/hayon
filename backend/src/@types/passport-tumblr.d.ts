declare module "passport-tumblr" {
  import { Strategy as PassportStrategy } from "passport";
  import { Request } from "express";

  export interface Profile {
    id: string;
    username: string;
    displayName?: string;
    provider: "tumblr";
    _json: any;
  }

  export interface StrategyOptions {
    consumerKey: string;
    consumerSecret: string;
    callbackURL: string;
  }

  export type VerifyCallback = (
    token: string,
    tokenSecret: string,
    profile: Profile,
    done: (err: any, user?: any) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    authenticate(req: Request, options?: any): void;

    constructor(options: StrategyOptions, verify: VerifyCallback);
  }
}
