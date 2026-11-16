import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsEnum, IsString, Length, MaxLength } from 'class-validator';
import { UserRole } from '../../users/user-role.enum';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '../../../common/auth/password-policy';

export class RegisterDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 255)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  password!: string;

  @IsDefined()
  @IsEnum(UserRole, { message: 'Role must be doctor or patient.' })
  role!: UserRole;
}
