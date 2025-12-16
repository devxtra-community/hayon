import { JWTPayload } from "../utils/jwt";


// tod:why? 


declare global {
  namespace Express {
    interface Request {
      jwtUser?: JWTPayload;
    }
  }
}

export {};
