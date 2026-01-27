import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Barcode, BarcodeDocument, BarcodeType } from './schemas/barcode.schema';
import { CountersService } from '../counters/counters.service';
import { ProductVariantsService } from '../product-variants/product-variants.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class BarcodesService {
  constructor(
    @InjectModel(Barcode.name) private barcodeModel: Model<BarcodeDocument>,
    private countersService: CountersService,
    private productVariantsService: ProductVariantsService,
    private auditLogsService: AuditLogsService,
  ) {}

  async findByValue(value: string): Promise<BarcodeDocument | null> {
    return this.barcodeModel
      .findOne({ value })
      .populate('variantId')
      .populate('createdBy', 'username fullName')
      .exec();
  }

  async findByVariant(variantId: string): Promise<BarcodeDocument[]> {
    return this.barcodeModel
      .find({ variantId })
      .populate('createdBy', 'username fullName')
      .sort({ isPrimary: -1, createdAt: -1 })
      .exec();
  }

  async getPrimaryBarcode(variantId: string): Promise<BarcodeDocument | null> {
    return this.barcodeModel.findOne({ variantId, isPrimary: true }).exec();
  }

  async create(createBarcodeDto: any, userId: string): Promise<BarcodeDocument> {
    // Check if barcode already exists
    const existing = await this.barcodeModel.findOne({ value: createBarcodeDto.value }).exec();
    if (existing) {
      throw new ConflictException('Bu barkod artıq mövcuddur');
    }

    // Verify variant exists
    await this.productVariantsService.findById(createBarcodeDto.variantId);

    // If this is set as primary, unset other primary barcodes for this variant
    if (createBarcodeDto.isPrimary) {
      await this.barcodeModel.updateMany(
        { variantId: createBarcodeDto.variantId, isPrimary: true },
        { $set: { isPrimary: false } },
      ).exec();
    }

    const barcode = new this.barcodeModel({
      ...createBarcodeDto,
      createdBy: userId,
    });
    const saved = await barcode.save();

    await this.auditLogsService.create({
      entityType: 'barcode',
      entityId: saved._id.toString(),
      action: 'create',
      userId,
      oldValue: null,
      newValue: saved.toObject(),
    });

    return saved;
  }

  async generateInternalBarcode(variantId: string, userId: string): Promise<BarcodeDocument> {
    // Check if variant already has an internal barcode
    const existingInternal = await this.barcodeModel.findOne({
      variantId,
      type: BarcodeType.INTERNAL,
    }).exec();

    if (existingInternal) {
      throw new BadRequestException('Bu variant üçün artıq daxili barkod mövcuddur');
    }

    // Generate unique internal barcode
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        const seq = await this.countersService.getNextSequence('internal_barcode_seq');
        const barcodeValue = `SIMBA-${String(seq).padStart(8, '0')}`;

        // Check if it already exists (shouldn't happen, but safety check)
        const exists = await this.barcodeModel.findOne({ value: barcodeValue }).exec();
        if (exists) {
          attempts++;
          continue;
        }

        // Create the barcode
        const barcode = new this.barcodeModel({
          value: barcodeValue,
          type: BarcodeType.INTERNAL,
          variantId,
          isPrimary: true, // Internal barcode is primary if no other primary exists
          createdBy: userId,
        });

        // Check if variant has any primary barcode
        const hasPrimary = await this.barcodeModel.findOne({
          variantId,
          isPrimary: true,
        }).exec();

        if (!hasPrimary) {
          barcode.isPrimary = true;
        } else {
          barcode.isPrimary = false;
        }

        const saved = await barcode.save();

        await this.auditLogsService.create({
          entityType: 'barcode',
          entityId: saved._id.toString(),
          action: 'generate_internal',
          userId,
          oldValue: null,
          newValue: saved.toObject(),
        });

        return saved;
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicate key error, retry
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new Error('Daxili barkod yaratma uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.');
  }

  async setPrimary(barcodeId: string, userId: string): Promise<BarcodeDocument> {
    const barcode = await this.barcodeModel.findById(barcodeId).exec();
    if (!barcode) {
      throw new NotFoundException('Barkod tapılmadı');
    }

    // Unset other primary barcodes for this variant
    await this.barcodeModel.updateMany(
      { variantId: barcode.variantId, isPrimary: true, _id: { $ne: barcodeId } },
      { $set: { isPrimary: false } },
    ).exec();

    // Set this as primary
    barcode.isPrimary = true;
    const updated = await barcode.save();

    await this.auditLogsService.create({
      entityType: 'barcode',
      entityId: barcodeId,
      action: 'set_primary',
      userId,
      oldValue: { isPrimary: false },
      newValue: { isPrimary: true },
    });

    return updated;
  }

  async remove(barcodeId: string, userId: string): Promise<void> {
    const barcode = await this.barcodeModel.findById(barcodeId).exec();
    if (!barcode) {
      throw new NotFoundException('Barkod tapılmadı');
    }

    await this.barcodeModel.findByIdAndDelete(barcodeId).exec();

    await this.auditLogsService.create({
      entityType: 'barcode',
      entityId: barcodeId,
      action: 'delete',
      userId,
      oldValue: barcode.toObject(),
      newValue: null,
    });
  }

  async lookup(value: string): Promise<{ variant: any; barcode: BarcodeDocument } | null> {
    const barcode = await this.findByValue(value);
    if (!barcode) {
      return null;
    }

    const variant = await this.productVariantsService.findById(barcode.variantId.toString());
    return {
      variant: variant.toObject(),
      barcode: barcode.toObject(),
    };
  }
}


