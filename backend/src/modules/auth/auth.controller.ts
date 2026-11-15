import { Authorized, Body, CurrentUser, Get, HttpCode, JsonController, Post } from 'routing-controllers';
import { publicUser, User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@JsonController('/auth')
export class AuthController {
  private service = new AuthService();

  @Post('/register')
  @HttpCode(201)
  register(@Body({ required: true }) input: RegisterDto) {
    return this.service.register(input);
  }

  @Post('/login')
  login(@Body({ required: true }) input: LoginDto) {
    return this.service.login(input);
  }

  @Get('/me')
  @Authorized()
  me(@CurrentUser({ required: true }) user: User) {
    return { user: publicUser(user) };
  }
}
