import { AppDataSource } from '../../database/data-source';
import { reportRange, ReportType } from '../../common/dates/date.utils';
import { Reading } from '../readings/reading.entity';

export class ReportsService {
  async get(userId: string, type: ReportType, date: string) {
    const range = reportRange(type, date);
    const readings = AppDataSource.getRepository(Reading);
    const result = await readings.createQueryBuilder('reading')
      .select('COUNT(*)', 'count')
      .addSelect('MAX(reading.value)', 'highest')
      .addSelect('MIN(reading.value)', 'lowest')
      .addSelect('ROUND(AVG(reading.value), 1)', 'average')
      .where('reading.userId = :userId', { userId })
      .andWhere('reading.date BETWEEN :from AND :to', range)
      .getRawOne<{ count: string; highest: number | null; lowest: number | null; average: string | null }>();
    const count = Number(result!.count);
    const report = {
      type, selectedDate: date, ...range, count,
      highest: result!.highest,
      lowest: result!.lowest,
      average: result!.average === null ? null : Number(result!.average),
      message: count === 0 ? 'No readings recorded for this period yet.' : null,
    };
    if (type === 'daily') {
      return { ...report, readings: await readings.find({ where: { userId, date }, order: { slot: 'ASC' } }) };
    }
    return report;
  }
}
