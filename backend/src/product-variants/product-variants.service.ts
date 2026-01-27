import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductVariant, ProductVariantDocument } from './schemas/product-variant.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createVariantDto: any, userId: string): Promise<ProductVariantDocument> {
    const variant = new this.variantModel(createVariantDto);
    const saved = await variant.save();

    await this.auditLogsService.create({
      entityType: 'product_variant',
      entityId: saved._id.toString(),
      action: 'create',
      userId,
      oldValue: null,
      newValue: saved.toObject(),
    });

    return saved;
  }

  async findAll(filters?: any): Promise<ProductVariantDocument[]> {
    const query: any = {};
    if (filters?.productId) {
      query.productId = filters.productId;
    }
    if (filters?.active !== undefined) {
      query.active = filters.active;
    }
    return this.variantModel.find(query).populate('productId').exec();
  }

  async findById(id: string): Promise<ProductVariantDocument> {
    const variant = await this.variantModel.findById(id).populate('productId').exec();
    if (!variant) {
      throw new NotFoundException('Variant tapılmadı');
    }
    return variant;
  }

  async update(id: string, updateVariantDto: any, userId: string): Promise<ProductVariantDocument> {
    const oldVariant = await this.variantModel.findById(id).exec();
    if (!oldVariant) {
      throw new NotFoundException('Variant tapılmadı');
    }

    const oldValue = oldVariant.toObject();
    const updated = await this.variantModel.findByIdAndUpdate(id, updateVariantDto, { new: true }).exec();

    await this.auditLogsService.create({
      entityType: 'product_variant',
      entityId: id,
      action: 'update',
      userId,
      oldValue,
      newValue: updated.toObject(),
    });

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const variant = await this.variantModel.findByIdAndUpdate(id, { active: false }, { new: true }).exec();
    if (!variant) {
      throw new NotFoundException('Variant tapılmadı');
    }

    await this.auditLogsService.create({
      entityType: 'product_variant',
      entityId: id,
      action: 'deactivate',
      userId,
      oldValue: null,
      newValue: variant.toObject(),
    });
  }

  async getDefaultVariant(productId: string): Promise<ProductVariantDocument | null> {
    // Get or create default variant for product (no attributes)
    let variant = await this.variantModel.findOne({ productId, 'attributes': {} }).exec();
    
    if (!variant) {
      // Create default variant
      const product = await this.variantModel.db.collection('products').findOne({ 
        _id: new Types.ObjectId(productId) 
      });
      if (product) {
        variant = new this.variantModel({
          productId,
          attributes: {},
          costPrice: product.costPrice || 0,
          salePrice: product.salePrice || 0,
          active: true,
        });
        await variant.save();
      }
    }
    
    return variant;
  }
}



