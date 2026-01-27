import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createProductDto: any, userId: string): Promise<ProductDocument> {
    // Remove barcode from product - barcodes are now handled separately via variants
    const { barcode, ean, ...productData } = createProductDto;

    const product = new this.productModel(productData);
    const saved = await product.save();

    // Create default variant for the product
    // This will be done via ProductVariantsService, but we can trigger it here
    // The variant will be created when first barcode is assigned

    await this.auditLogsService.create({
      entityType: 'product',
      entityId: saved._id.toString(),
      action: 'create',
      userId,
      oldValue: null,
      newValue: saved.toObject(),
    });

    return saved;
  }

  async findAll(filters?: any): Promise<ProductDocument[]> {
    const query: any = {};
    if (filters?.active !== undefined) {
      query.active = filters.active;
    }
    if (filters?.search) {
      query.$text = { $search: filters.search };
    }
    return this.productModel.find(query).exec();
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Məhsul tapılmadı');
    }
    return product;
  }

  async findByBarcode(barcode: string): Promise<ProductDocument> {
    // This method is deprecated - use barcodes service instead
    // Keeping for backward compatibility
    throw new NotFoundException('Barkod axtarışı üçün /barcodes/lookup/:value endpoint-indən istifadə edin');
  }

  async update(id: string, updateProductDto: any, userId: string): Promise<ProductDocument> {
    const oldProduct = await this.productModel.findById(id).exec();
    if (!oldProduct) {
      throw new NotFoundException('Məhsul tapılmadı');
    }

    const oldValue = oldProduct.toObject();
    const updated = await this.productModel.findByIdAndUpdate(id, updateProductDto, { new: true }).exec();

    // Log price changes
    if (updateProductDto.costPrice !== undefined || updateProductDto.salePrice !== undefined) {
      await this.auditLogsService.create({
        entityType: 'product',
        entityId: id,
        action: 'price_update',
        userId,
        oldValue: { costPrice: oldValue.costPrice, salePrice: oldValue.salePrice },
        newValue: { costPrice: updated.costPrice, salePrice: updated.salePrice },
      });
    } else {
      await this.auditLogsService.create({
        entityType: 'product',
        entityId: id,
        action: 'update',
        userId,
        oldValue,
        newValue: updated.toObject(),
      });
    }

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const product = await this.productModel.findByIdAndUpdate(id, { active: false }, { new: true }).exec();
    if (!product) {
      throw new NotFoundException('Məhsul tapılmadı');
    }

    await this.auditLogsService.create({
      entityType: 'product',
      entityId: id,
      action: 'deactivate',
      userId,
      oldValue: null,
      newValue: product.toObject(),
    });
  }
}

