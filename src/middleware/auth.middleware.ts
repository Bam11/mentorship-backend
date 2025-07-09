import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Extend Express Request to include `user`
export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

// Middleware to verify JWT token
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as {
      userId: string;
      role: string;
    };

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next(); // pass control to the next middleware
  } catch (error) {
    console.error('JWT Error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};
