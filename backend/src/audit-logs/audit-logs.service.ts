import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createAuditLogDto: any): Promise<AuditLogDocument> {
    const log = new this.auditLogModel(createAuditLogDto);
    return log.save();
  }

  async findAll(filters?: any): Promise<AuditLogDocument[]> {
    const query: any = {};
    if (filters?.entityType) {
      query.entityType = filters.entityType;
    }
    if (filters?.entityId) {
      query.entityId = filters.entityId;
    }
    if (filters?.userId) {
      query.userId = filters.userId;
    }
    if (filters?.action) {
      query.action = filters.action;
    }
    return this.auditLogModel
      .find(query)
      .populate('userId', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 100)
      .exec();
  }
}


