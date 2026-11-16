import { BadRequestError, HttpError, NotFoundError } from "routing-controllers";
import { isUUID } from "class-validator";
import { AppDataSource } from "../../database/data-source";
import { isUniqueViolation } from "../../common/errors";
import { validateDate } from "../../common/dates/date.utils";
import { CreateReadingDto } from "./dto/create-reading.dto";
import { UpdateReadingDto } from "./dto/update-reading.dto";
import { Reading } from "./reading.entity";
import { slotLabels } from "./reading-slot.enum";

export class ReadingsService {
  private get readings() {
    return AppDataSource.getRepository(Reading);
  }

  async list(userId: string, date?: string) {
    if (date !== undefined) validateDate(date);
    const readings = await this.readings.find({
      where: date === undefined ? { userId } : { userId, date },
      order: { date: "DESC", slot: "ASC" },
    });
    return { readings };
  }

  async get(userId: string, id: string) {
    if (!isUUID(id))
      throw new BadRequestError("Reading ID must be a valid UUID.");
    const reading = await this.readings.findOneBy({ id, userId });
    // Do not reveal whether an ID belongs to a different user.
    if (!reading) throw new NotFoundError("Reading not found.");
    return reading;
  }

  async create(userId: string, input: CreateReadingDto) {
    validateDate(input.date);
    return this.save(this.readings.create({ ...input, userId }));
  }

  async update(userId: string, id: string, input: UpdateReadingDto) {
    const reading = await this.get(userId, id);
    if (!Object.keys(input).length)
      throw new BadRequestError("Provide a date, slot, or value to update.");
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
        throw new HttpError(
          409,
          `You already have an ${slotLabels[reading.slot]} reading for this date. You can add only 4 readings per day.`,
        );
      }
      throw error;
    }
  }
}
