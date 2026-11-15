import type { Request } from 'express';
import { Action, UnauthorizedError } from 'routing-controllers';
import { AppDataSource } from '../../database/data-source';
import { User } from '../../modules/users/user.entity';
import { verifyToken } from './jwt';

type AuthenticatedRequest = Request & { currentUser?: User };

export async function currentUserChecker(action: Action): Promise<User> {
  const request = action.request as AuthenticatedRequest;
  if (request.currentUser) return request.currentUser;
  const header = request.headers.authorization;
  const match = header && /^Bearer ([^\s]+)$/i.exec(header);
  if (!match) throw new UnauthorizedError('Please log in to continue.');

  let id: string;
  try {
    id = verifyToken(match[1]);
  } catch {
    throw new UnauthorizedError('Your token is invalid or expired. Please log in again.');
  }
  const user = await AppDataSource.getRepository(User).findOneBy({ id });
  if (!user) throw new UnauthorizedError('Your account is no longer available.');
  request.currentUser = user;
  return user;
}
