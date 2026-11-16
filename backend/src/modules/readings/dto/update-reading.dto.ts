import { IsEnum, IsInt, IsString, Max, Min, ValidateIf } from "class-validator";
import { ReadingSlot } from "../reading-slot.enum";

// Unlike IsOptional, ValidateIf allows omission but still rejects null.
export class UpdateReadingDto {
  @IsInt({ message: "Value must be a whole number between 40 and 600 mg/dl." })
  @Min(40)
  @Max(600)
  value!: number;
}
