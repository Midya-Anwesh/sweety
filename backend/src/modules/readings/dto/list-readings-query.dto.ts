import { IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class ListReadingsQueryDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  date?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  from?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
