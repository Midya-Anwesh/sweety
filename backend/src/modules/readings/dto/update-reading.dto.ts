import { IsInt, Max, Min } from 'class-validator';

// Date and slot are immutable; correcting either requires recreating the reading.
export class UpdateReadingDto {
  @IsInt({ message: 'Value must be a whole number between 40 and 600 mg/dl.' })
  @Min(40)
  @Max(600)
  value!: number;
}
