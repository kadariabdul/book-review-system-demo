import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { Request } from 'express';
import CustomError from './customError';

const APP_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '30min';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
const APP_SECRET_REFRESH = process.env.REFRESH_TOKEN_SECRET || 'your-secret-key';

function getTokenPayload(token: string) {
  return jwt.verify(token, APP_SECRET) as User;
}

function getUserId(req: Request, authToken?: string) {
  if (req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        throw new CustomError('Token Not Found', 401, 'UNAUTHORIZED');
      }
      const { id } = getTokenPayload(token);
      return id;
    }
  } else if (authToken) {
    const { id } = getTokenPayload(authToken);
    return id;
  }
  throw new CustomError('Not authenticated', 401, 'UNAUTHORIZED');
}

export { APP_SECRET, APP_SECRET_REFRESH, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, getUserId };
