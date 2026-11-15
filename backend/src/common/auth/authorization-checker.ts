import { Action } from 'routing-controllers';
import { currentUserChecker } from './current-user-checker';

export async function authorizationChecker(action: Action): Promise<boolean> {
  await currentUserChecker(action);
  return true;
}
