import { IsDefined, IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import { ReadingSlot } from '../reading-slot.enum';

export class CreateReadingDto {
  @IsDefined()
  @IsString()
  date!: string;

  @IsDefined()
  @IsEnum(ReadingSlot, { message: 'Please select one of the four reading slots.' })
  slot!: ReadingSlot;

  @IsDefined({ message: 'Please enter a glucose value.' })
  @IsInt({ message: 'Value must be a whole number between 40 and 600 mg/dl.' })
  @Min(40, { message: 'Value must be between 40 and 600 mg/dl.' })
  @Max(600, { message: 'Value must be between 40 and 600 mg/dl.' })
  value!: number;
}
