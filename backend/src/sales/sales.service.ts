import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument, SaleStatus, PaymentMethod } from './schemas/sale.schema';
import { CashClosing, CashClosingDocument } from './schemas/cash-closing.schema';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ProductsService } from '../products/products.service';
import { MovementType } from '../stock-movements/schemas/stock-movement.schema';
import { PartyType } from '../ledger/schemas/ledger-entry.schema';

@Injectable()
export class SalesService {
  private saleCounter: Map<string, number> = new Map();

  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(CashClosing.name) private cashClosingModel: Model<CashClosingDocument>,
    private stockMovementsService: StockMovementsService,
    private ledgerService: LedgerService,
    private auditLogsService: AuditLogsService,
    private productsService: ProductsService,
  ) {}

  private async generateSaleNo(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const key = `SALE-${today}`;
    
    if (!this.saleCounter.has(key)) {
      const lastSale = await this.saleModel
        .findOne({ saleNo: new RegExp(`^${key}-`) })
        .sort({ saleNo: -1 })
        .exec();
      
      if (lastSale) {
        const match = lastSale.saleNo.match(/-(\d+)$/);
        this.saleCounter.set(key, match ? parseInt(match[1], 10) : 0);
      } else {
        this.saleCounter.set(key, 0);
      }
    }

    this.saleCounter.set(key, (this.saleCounter.get(key) || 0) + 1);
    const counter = String(this.saleCounter.get(key)!).padStart(5, '0');
    return `${key}-${counter}`;
  }

  async create(createSaleDto: any, userId: string, userRole: string): Promise<SaleDocument> {
    // Validate discount limits
    const totalDiscount = createSaleDto.discount || 0;
    const maxDiscountPercent = userRole === 'admin' || userRole === 'manager' ? 50 : 20;
    
    if (createSaleDto.items) {
      const totalBeforeDiscount = createSaleDto.items.reduce((sum: number, item: any) => 
        sum + (item.unitPrice * item.quantity), 0);
      
      if (totalDiscount > 0) {
        const discountPercent = (totalDiscount / totalBeforeDiscount) * 100;
        if (discountPercent > maxDiscountPercent && !createSaleDto.managerApproval) {
          throw new ForbiddenException(
            `Endirim ${maxDiscountPercent}% -dən çox ola bilməz. Menecer təsdiqi tələb olunur.`
          );
        }
      }
    }

    const saleNo = await this.generateSaleNo();
    const sale = new this.saleModel({
      ...createSaleDto,
      saleNo,
      cashierId: userId,
      status: SaleStatus.COMPLETED,
    });

    // Calculate totals
    let subtotal = 0;
    for (const item of sale.items) {
      const product = await this.productsService.findById(item.productId.toString());
      item.productName = product.name;
      item.total = (item.unitPrice * item.quantity) - (item.discount || 0);
      subtotal += item.total;
    }

    sale.subtotal = subtotal;
    sale.total = subtotal - (sale.discount || 0);

    // Handle payment breakdown
    if (sale.paymentMethod === PaymentMethod.MIXED && sale.paymentBreakdown) {
      const sum = (sale.paymentBreakdown.cash || 0) + 
                  (sale.paymentBreakdown.card || 0) + 
                  (sale.paymentBreakdown.transfer || 0);
      if (Math.abs(sum - sale.total) > 0.01) {
        throw new BadRequestException('Ödəniş məbləği ümumi məbləğə uyğun deyil');
      }
    }

    const saved = await sale.save();

    // Create stock movements
    // Note: productId in sale items can be either productId or variantId
    // Stock movements work with variants now
    for (const item of saved.items) {
      await this.stockMovementsService.create({
        productId: item.productId, // This is now variantId
        locationId: saved.locationId,
        qty: -item.quantity,
        type: MovementType.SALE_OUT,
        refType: 'sale',
        refId: saved._id,
        note: `Satış: ${saved.saleNo}`,
      }, userId);
    }

    // Create ledger entry for credit sales
    if (saved.customerId && saved.remainingDebt > 0) {
      await this.ledgerService.create({
        partyType: PartyType.CUSTOMER,
        partyId: saved.customerId.toString(),
        amount: saved.remainingDebt,
        currency: 'AZN',
        type: 'sale_on_credit',
        refId: saved._id.toString(),
        refType: 'sale',
        note: `Kredit satış: ${saved.saleNo}`,
      }, userId);
    }

    await this.auditLogsService.create({
      entityType: 'sale',
      entityId: saved._id.toString(),
      action: 'create',
      userId,
      oldValue: null,
      newValue: saved.toObject(),
    });

    return saved;
  }

  async findAll(filters?: any): Promise<SaleDocument[]> {
    const query: any = {};
    if (filters?.locationId) {
      query.locationId = filters.locationId;
    }
    if (filters?.cashierId) {
      query.cashierId = filters.cashierId;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.createdAt.$lte = new Date(filters.dateTo);
      }
    }
    return this.saleModel
      .find(query)
      .populate('locationId')
      .populate('cashierId', 'username fullName')
      .populate('customerId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<SaleDocument> {
    const sale = await this.saleModel
      .findById(id)
      .populate('locationId')
      .populate('cashierId', 'username fullName')
      .populate('customerId')
      .exec();
    if (!sale) {
      throw new NotFoundException('Satış tapılmadı');
    }
    return sale;
  }

  async findBySaleNo(saleNo: string): Promise<SaleDocument> {
    const sale = await this.saleModel
      .findOne({ saleNo })
      .populate('locationId')
      .populate('cashierId', 'username fullName')
      .populate('customerId')
      .exec();
    if (!sale) {
      throw new NotFoundException('Satış tapılmadı');
    }
    return sale;
  }

  async voidSale(id: string, reason: string, userId: string, userRole: string): Promise<SaleDocument> {
    if (userRole !== 'admin' && userRole !== 'manager') {
      throw new ForbiddenException('Yalnız menecer və ya admin satışı ləğv edə bilər');
    }

    const sale = await this.saleModel.findById(id).exec();
    if (!sale) {
      throw new NotFoundException('Satış tapılmadı');
    }

    if (sale.status === SaleStatus.VOIDED) {
      throw new BadRequestException('Satış artıq ləğv edilib');
    }

    const oldValue = sale.toObject();
    sale.status = SaleStatus.VOIDED;
    sale.voidedBy = userId as any;
    sale.voidReason = reason;
    const updated = await sale.save();

    // Reverse stock movements
    for (const item of sale.items) {
      await this.stockMovementsService.create({
        productId: item.productId,
        locationId: sale.locationId,
        qty: item.quantity,
        type: MovementType.RETURN_IN,
        refType: 'sale_void',
        refId: sale._id,
        note: `Ləğv edilmiş satış: ${sale.saleNo}`,
      }, userId);
    }

    // Reverse ledger entry if credit sale
    if (sale.customerId && sale.remainingDebt > 0) {
      await this.ledgerService.create({
        partyType: PartyType.CUSTOMER,
        partyId: sale.customerId.toString(),
        amount: -sale.remainingDebt,
        currency: 'AZN',
        type: 'payment',
        refId: sale._id.toString(),
        refType: 'sale_void',
        note: `Ləğv edilmiş satış: ${sale.saleNo}`,
      }, userId);
    }

    await this.auditLogsService.create({
      entityType: 'sale',
      entityId: id,
      action: 'void',
      userId,
      oldValue,
      newValue: updated.toObject(),
    });

    return updated;
  }

  async createCashClosing(createDto: any, userId: string): Promise<CashClosingDocument> {
    const difference = createDto.countedCash - createDto.expectedCash;
    
    if (!createDto.differenceReason) {
      throw new BadRequestException('Fərq səbəbi mütləqdir');
    }

    const closing = new this.cashClosingModel({
      ...createDto,
      difference,
      userId,
    });

    return closing.save();
  }

  async getCashClosings(filters?: any): Promise<CashClosingDocument[]> {
    const query: any = {};
    if (filters?.locationId) {
      query.locationId = filters.locationId;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      query.date = {};
      if (filters.dateFrom) {
        query.date.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.date.$lte = new Date(filters.dateTo);
      }
    }
    return this.cashClosingModel
      .find(query)
      .populate('locationId')
      .populate('userId', 'username fullName')
      .sort({ date: -1 })
      .exec();
  }

  async getDaySales(locationId: string, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.saleModel
      .find({
        locationId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: SaleStatus.COMPLETED,
      })
      .exec();

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const cashSales = sales
      .filter(s => s.paymentMethod === PaymentMethod.CASH || s.paymentMethod === PaymentMethod.MIXED)
      .reduce((sum, s) => {
        if (s.paymentMethod === PaymentMethod.CASH) {
          return sum + s.total;
        }
        return sum + (s.paymentBreakdown?.cash || 0);
      }, 0);

    return {
      date,
      totalSales,
      expectedCash: cashSales,
      saleCount: sales.length,
      sales,
    };
  }
}

