import { BadRequestError, HttpError, NotFoundError } from 'routing-controllers';
import { isUUID } from 'class-validator';
import { AppDataSource } from '../../database/data-source';
import { isUniqueViolation } from '../../common/errors';
import { validateDate } from '../../common/dates/date.utils';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UpdateReadingDto } from './dto/update-reading.dto';
import { ListReadingsQueryDto } from './dto/list-readings-query.dto';
import { Reading } from './reading.entity';
import { slotLabels } from './reading-slot.enum';

export interface PaginationButton {
  type: 'previous' | 'first' | 'last' | 'page' | 'ellipsis' | 'next';
  label: string;
  page: number | null;
  active: boolean;
  disabled: boolean;
}

export class ReadingsService {
  private get readings() { return AppDataSource.getRepository(Reading); }

  async list(userId: string, queryOrDate?: ListReadingsQueryDto | string) {
    let date: string | undefined;
    let page = 1;
    let limit = 20;

    if (typeof queryOrDate === 'string') {
      date = queryOrDate;
    } else if (queryOrDate) {
      date = queryOrDate.date;
      if (queryOrDate.page !== undefined && Number(queryOrDate.page) > 0) {
        page = Math.floor(Number(queryOrDate.page));
      }
      if (queryOrDate.limit !== undefined && Number(queryOrDate.limit) > 0) {
        limit = Math.floor(Number(queryOrDate.limit));
      }
    }

    if (date !== undefined) validateDate(date);

    const where = date === undefined ? { userId } : { userId, date };
    const [readings, total] = await this.readings.findAndCount({
      where,
      order: { date: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const linked = this.buildPaginationButtons(currentPage, totalPages);

    return {
      data: readings,
      readings,
      pagination: {
        total,
        page: currentPage,
        limit,
        totalPages,
        first: 1,
        last: totalPages,
        previous: currentPage > 1 ? currentPage - 1 : null,
        next: currentPage < totalPages ? currentPage + 1 : null,
        current: currentPage,
      },
      linked,
      links: {
        first: 1,
        last: totalPages,
        previous: currentPage > 1 ? currentPage - 1 : null,
        next: currentPage < totalPages ? currentPage + 1 : null,
        current: currentPage,
        buttons: linked,
      },
    };
  }

  buildPaginationButtons(currentPage: number, totalPages: number): PaginationButton[] {
    const buttons: PaginationButton[] = [];

    buttons.push({
      type: 'previous',
      label: 'previous',
      page: currentPage > 1 ? currentPage - 1 : null,
      active: false,
      disabled: currentPage <= 1,
    });

    if (totalPages <= 1) {
      buttons.push({
        type: 'first',
        label: '1',
        page: 1,
        active: true,
        disabled: false,
      });
    } else if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) {
        buttons.push({
          type: p === 1 ? 'first' : p === totalPages ? 'last' : 'page',
          label: String(p),
          page: p,
          active: p === currentPage,
          disabled: false,
        });
      }
    } else {
      let windowStart = currentPage - 2;
      let windowEnd = currentPage + 2;

      if (windowStart < 1) {
        windowEnd += (1 - windowStart);
        windowStart = 1;
      }
      if (windowEnd > totalPages) {
        windowStart -= (windowEnd - totalPages);
        windowEnd = totalPages;
      }
      if (windowStart < 1) windowStart = 1;

      if (windowStart > 1) {
        buttons.push({
          type: 'first',
          label: '1',
          page: 1,
          active: currentPage === 1,
          disabled: false,
        });

        if (windowStart > 2) {
          buttons.push({
            type: 'ellipsis',
            label: 'ellipces',
            page: null,
            active: false,
            disabled: true,
          });
        }
      }

      for (let p = windowStart; p <= windowEnd; p++) {
        if (p === 1 && windowStart > 1) continue;
        if (p === totalPages && windowEnd < totalPages) continue;

        buttons.push({
          type: p === 1 ? 'first' : p === totalPages ? 'last' : 'page',
          label: String(p),
          page: p,
          active: p === currentPage,
          disabled: false,
        });
      }

      if (windowEnd < totalPages) {
        if (windowEnd < totalPages - 1) {
          buttons.push({
            type: 'ellipsis',
            label: 'ellipces',
            page: null,
            active: false,
            disabled: true,
          });
        }

        buttons.push({
          type: 'last',
          label: String(totalPages),
          page: totalPages,
          active: currentPage === totalPages,
          disabled: false,
        });
      }
    }

    buttons.push({
      type: 'next',
      label: 'next',
      page: currentPage < totalPages ? currentPage + 1 : null,
      active: false,
      disabled: currentPage >= totalPages,
    });

    return buttons;
  }

  async get(userId: string, id: string) {
    if (!isUUID(id)) throw new BadRequestError('Reading ID must be a valid UUID.');
    const reading = await this.readings.findOneBy({ id, userId });
    if (!reading) throw new NotFoundError('Reading not found.');
    return reading;
  }

  async create(userId: string, input: CreateReadingDto) {
    validateDate(input.date);
    return this.save(this.readings.create({ ...input, userId }));
  }

  async update(userId: string, id: string, input: UpdateReadingDto) {
    const reading = await this.get(userId, id);
    reading.value = input.value;
    return this.save(reading);
  }

  async delete(userId: string, id: string) {
    await this.get(userId, id);
    await this.readings.delete({ id, userId });
  }

  private async save(reading: Reading) {
    try {
      return await this.readings.save(reading);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new HttpError(409, `You already have an ${slotLabels[reading.slot]} reading for this date. You can add only 4 readings per day.`);
      }
      throw error;
    }
  }
}
