import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createLocationDto: any, userId: string): Promise<LocationDocument> {
    const location = new this.locationModel(createLocationDto);
    const saved = await location.save();

    await this.auditLogsService.create({
      entityType: 'location',
      entityId: saved._id.toString(),
      action: 'create',
      userId,
      oldValue: null,
      newValue: saved.toObject(),
    });

    return saved;
  }

  async findAll(filters?: any): Promise<LocationDocument[]> {
    const query: any = {};
    if (filters?.type) {
      query.type = filters.type;
    }
    if (filters?.active !== undefined) {
      query.active = filters.active;
    }
    return this.locationModel.find(query).exec();
  }

  async findById(id: string): Promise<LocationDocument> {
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException('Lokasiya tapılmadı');
    }
    return location;
  }

  async update(id: string, updateLocationDto: any, userId: string): Promise<LocationDocument> {
    const oldLocation = await this.locationModel.findById(id).exec();
    if (!oldLocation) {
      throw new NotFoundException('Lokasiya tapılmadı');
    }

    const oldValue = oldLocation.toObject();
    const updated = await this.locationModel.findByIdAndUpdate(id, updateLocationDto, { new: true }).exec();

    await this.auditLogsService.create({
      entityType: 'location',
      entityId: id,
      action: 'update',
      userId,
      oldValue,
      newValue: updated.toObject(),
    });

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const location = await this.locationModel.findByIdAndUpdate(id, { active: false }, { new: true }).exec();
    if (!location) {
      throw new NotFoundException('Lokasiya tapılmadı');
    }

    await this.auditLogsService.create({
      entityType: 'location',
      entityId: id,
      action: 'deactivate',
      userId,
      oldValue: null,
      newValue: location.toObject(),
    });
  }
}


