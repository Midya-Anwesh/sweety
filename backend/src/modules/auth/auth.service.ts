import { argon2id, hash, verify } from 'argon2';
import { HttpError, UnauthorizedError } from 'routing-controllers';
import { AppDataSource } from '../../database/data-source';
import { env } from '../../config/env';
import { isUniqueViolation } from '../../common/errors';
import { issueToken } from '../../common/auth/jwt';
import { publicUser, User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export class AuthService {
  private get users() { return AppDataSource.getRepository(User); }

  async register(input: RegisterDto) {
    const user = this.users.create({
      name: input.name, email: input.email, role: input.role,
      passwordHash: await hash(input.password, {
        type: argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      }),
    });
    try {
      await this.users.save(user);
    } catch (error) {
      if (isUniqueViolation(error)) throw new HttpError(409, 'An account with this email already exists.');
      throw error;
    }
    return { user: publicUser(user) };
  }

  async login(input: LoginDto) {
    const user = await this.users.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: input.email })
      .getOne();
    // Argon2-only: old hash formats require account recovery/recreation.
    // Reject them normally instead of passing unsupported formats to verify().
    if (!user || !user.passwordHash.startsWith('$argon2id$') ||
        !(await verify(user.passwordHash, input.password))) {
      throw new UnauthorizedError('Invalid email or password.');
    }
    return {
      token: issueToken(user.id), tokenType: 'Bearer',
      expiresIn: env.JWT_EXPIRES_IN, user: publicUser(user),
    };
  }
}
