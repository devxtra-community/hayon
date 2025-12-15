import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

// TODO: WHY ???. Move to types folder
declare global {
  namespace Express {
    interface Request {
      jwtUser?: JWTPayload;
    }
  }
}

export const authenticate =  (
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  try {
    const token = req.cookies.token;
   
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }
    const decoded = verifyToken(token);
    req.jwtUser = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};