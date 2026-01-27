import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementDocument, MovementType } from './schemas/stock-movement.schema';
import { StockBalance, StockBalanceDocument } from './schemas/stock-balance.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovementDocument>,
    @InjectModel(StockBalance.name) private balanceModel: Model<StockBalanceDocument>,
    private auditLogsService: AuditLogsService,
    private configService: ConfigService,
  ) {}

  async create(createMovementDto: any, userId: string): Promise<StockMovementDocument> {
    const allowNegative = this.configService.get('ALLOW_NEGATIVE_STOCK') === 'true';

    // Check stock availability for OUT movements
    if (createMovementDto.qty < 0 && !allowNegative) {
      const currentStock = await this.getStock(createMovementDto.productId, createMovementDto.locationId);
      if (currentStock < Math.abs(createMovementDto.qty)) {
        throw new BadRequestException(`Kifayət qədər ehtiyat yoxdur. Mövcud: ${currentStock}`);
      }
    }

    const movement = new this.movementModel({
      ...createMovementDto,
      createdBy: userId,
    });
    const saved = await movement.save();

    // Update stock balance
    await this.updateStockBalance(createMovementDto.productId, createMovementDto.locationId, createMovementDto.qty);

    await this.auditLogsService.create({
      entityType: 'stock_movement',
      entityId: saved._id.toString(),
      action: 'create',
      userId,
      oldValue: null,
      newValue: saved.toObject(),
    });

    return saved;
  }

  async createTransfer(
    productId: string,
    fromLocationId: string,
    toLocationId: string,
    qty: number,
    userId: string,
    note?: string,
  ): Promise<{ out: StockMovementDocument; in: StockMovementDocument }> {
    const transferId = `TRANSFER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create OUT movement
    const outMovement = await this.create(
      {
        productId,
        locationId: fromLocationId,
        qty: -Math.abs(qty),
        type: MovementType.TRANSFER_OUT,
        refType: 'transfer',
        transferId,
        note,
      },
      userId,
    );

    // Create IN movement
    const inMovement = await this.create(
      {
        productId,
        locationId: toLocationId,
        qty: Math.abs(qty),
        type: MovementType.TRANSFER_IN,
        refType: 'transfer',
        transferId,
        note,
      },
      userId,
    );

    return { out: outMovement, in: inMovement };
  }

  private async updateStockBalance(productId: string, locationId: string, qtyChange: number): Promise<void> {
    await this.balanceModel.findOneAndUpdate(
      { productId, locationId },
      {
        $inc: { quantity: qtyChange },
        $set: { lastMovementAt: new Date() },
      },
      { upsert: true, new: true },
    ).exec();
  }

  async getStock(productId: string, locationId: string): Promise<number> {
    const balance = await this.balanceModel.findOne({ productId, locationId }).exec();
    return balance ? balance.quantity : 0;
  }

  async getStockByLocation(locationId: string): Promise<any[]> {
    return this.balanceModel
      .find({ locationId })
      .populate('productId')
      .exec();
  }

  async getStockByProduct(productId: string): Promise<any[]> {
    return this.balanceModel
      .find({ productId })
      .populate('locationId')
      .exec();
  }

  async findAll(filters?: any): Promise<StockMovementDocument[]> {
    const query: any = {};
    if (filters?.productId) {
      query.productId = filters.productId;
    }
    if (filters?.locationId) {
      query.locationId = filters.locationId;
    }
    if (filters?.type) {
      query.type = filters.type;
    }
    return this.movementModel
      .find(query)
      .populate('productId')
      .populate('locationId')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<StockMovementDocument> {
    const movement = await this.movementModel
      .findById(id)
      .populate('productId')
      .populate('locationId')
      .populate('createdBy', 'username fullName')
      .exec();
    if (!movement) {
      throw new NotFoundException('Hərəkət tapılmadı');
    }
    return movement;
  }

  async getLowStock(threshold: number = 10): Promise<any[]> {
    return this.balanceModel
      .find({ quantity: { $lte: threshold } })
      .populate('productId')
      .populate('locationId')
      .exec();
  }
}


