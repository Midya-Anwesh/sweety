import { IsDefined, IsString } from 'class-validator';

export class ReportQueryDto {
  @IsDefined({ message: 'Please select a report date.' })
  @IsString()
  date!: string;
}
