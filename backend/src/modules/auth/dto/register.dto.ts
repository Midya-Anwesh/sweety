import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsEnum, IsString, Length, MaxLength } from 'class-validator';
import { UserRole } from '../../users/user-role.enum';

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
  @Length(8, 72)
  password!: string;

  @IsDefined()
  @IsEnum(UserRole, { message: 'Role must be doctor or patient.' })
  role!: UserRole;
}
