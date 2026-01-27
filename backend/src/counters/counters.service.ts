import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  async getNextSequence(name: string): Promise<number> {
    const counter = await this.counterModel.findByIdAndUpdate(
      name,
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    ).exec();
    return counter.seq;
  }

  async getCurrentSequence(name: string): Promise<number> {
    const counter = await this.counterModel.findById(name).exec();
    return counter ? counter.seq : 0;
  }
}


