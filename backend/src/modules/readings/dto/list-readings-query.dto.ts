import { IsString, ValidateIf } from 'class-validator';

export class ListReadingsQueryDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  date?: string;
}
