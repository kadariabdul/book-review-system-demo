import { getUserId, getUserIdRefreshToken } from '../auth';
import CustomError from '../customError';

const authMiddleware = (resolver: any) => async (parent: any, args: any, context: any, info: any) => {
  const userId = getUserId(context.req);
  if (!userId) {
    throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
  }
  return resolver(parent, args, { ...context, userId }, info);
};
const authMiddlewareRefresh = (resolver: any) => async (parent: any, args: any, context: any, info: any) => {
  const userId = getUserIdRefreshToken(context.req);
  if (!userId) {
    throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
  }
  return resolver(parent, args, { ...context, userId }, info);
};
export {authMiddleware, authMiddlewareRefresh};
