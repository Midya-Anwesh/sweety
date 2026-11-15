import { Authorized, CurrentUser, Get, JsonController, QueryParams } from 'routing-controllers';
import { User } from '../users/user.entity';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@Authorized()
@JsonController('/reports')
export class ReportsController {
  private service = new ReportsService();

  @Get('/daily')
  daily(@CurrentUser({ required: true }) user: User, @QueryParams() query: ReportQueryDto) {
    return this.service.get(user.id, 'daily', query.date);
  }

  @Get('/month-to-date')
  monthToDate(@CurrentUser({ required: true }) user: User, @QueryParams() query: ReportQueryDto) {
    return this.service.get(user.id, 'month-to-date', query.date);
  }

  @Get('/monthly')
  monthly(@CurrentUser({ required: true }) user: User, @QueryParams() query: ReportQueryDto) {
    return this.service.get(user.id, 'monthly', query.date);
  }
}
