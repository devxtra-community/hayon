import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ErrorResponse } from '../utils/responses';

export const authenticate =  (
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  try {
    const token = req.cookies.token;
   
    if (!token) {
      new ErrorResponse('No token provided', { status: 401 }).send(res);
      return;
    }
    const decoded = verifyToken(token);
    req.jwtUser = decoded;
    
    next();
  } catch (error) {
    new ErrorResponse('Invalid or expired token', { status: 401 }).send(res);
  }
};