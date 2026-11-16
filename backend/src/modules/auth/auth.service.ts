import { HttpError, UnauthorizedError } from "routing-controllers";
import { AppDataSource } from "../../database/data-source";
import { env } from "../../config/env";
import { isUniqueViolation } from "../../common/errors";
import { issueToken } from "../../common/auth/jwt";
import { publicUser, User } from "../users/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { argon2id, hash, verify } from "argon2";

export class AuthService {
  private get users() {
    return AppDataSource.getRepository(User);
  }

  async register(input: RegisterDto) {
    const user = this.users.create({
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hash(input.password, {
        type: argon2id,
        timeCost: 3,
      }),
    });
    try {
      await this.users.save(user);
    } catch (error) {
      if (isUniqueViolation(error))
        throw new HttpError(409, "An account with this email already exists.");
      throw error;
    }
    return { user: publicUser(user) };
  }

  async login(input: LoginDto) {
    if (Buffer.byteLength(input.password, "utf8") > 72) {
      throw new UnauthorizedError("Invalid email or password.");
    }
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email: input.email })
      .getOne();
    if (!user || !(await verify(user.passwordHash, input.password))) {
      throw new UnauthorizedError("Invalid email or password.");
    }
    return {
      token: issueToken(user.id),
      tokenType: "Bearer",
      expiresIn: env.JWT_EXPIRES_IN,
      user: publicUser(user),
    };
  }
}
