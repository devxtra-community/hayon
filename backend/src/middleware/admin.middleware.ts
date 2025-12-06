import { Request, Response, NextFunction } from 'express';

export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.jwtUser) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }
  
  if (req.jwtUser.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
    return;
  }
  
  next();
};