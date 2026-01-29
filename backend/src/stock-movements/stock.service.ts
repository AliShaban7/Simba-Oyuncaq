import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockMovement, StockMovementDocument, MovementType } from './schemas/stock-movement.schema';
import { StockBalance, StockBalanceDocument } from './schemas/stock-balance.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class StockService {
    constructor(
        @InjectModel(StockMovement.name) private movementModel: Model<StockMovementDocument>,
        @InjectModel(StockBalance.name) private balanceModel: Model<StockBalanceDocument>,
        private auditLogsService: AuditLogsService,
    ) { }

    // Get stock balances
    async getBalances(locationId?: string): Promise<any[]> {
        const query = locationId ? { locationId } : {};
        return this.balanceModel
            .find(query)
            .populate('productId')
            .populate('locationId')
            .exec();
    }

    // Get stock movements
    async getMovements(filters: any): Promise<any[]> {
        const query: any = {};
        if (filters.locationId) query.locationId = filters.locationId;
        if (filters.variantId) query.productId = filters.variantId;

        return this.movementModel
            .find(query)
            .populate('productId')
            .populate('locationId')
            .populate('createdBy', 'username fullName')
            .sort({ createdAt: -1 })
            .limit(filters.limit || 50)
            .exec();
    }

    // Receipt (Stock In)
    async createReceipt(receiptDto: any, userId: string): Promise<any> {
        const { locationId, supplier, documentNo, items } = receiptDto;
        const receiptId = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const movements = [];

        for (const item of items) {
            const movement = new this.movementModel({
                productId: item.variantId,
                locationId,
                qty: Math.abs(item.quantity),
                type: MovementType.PURCHASE_IN,
                refType: 'receipt',
                refId: receiptId,
                note: `Qəbul: ${documentNo || receiptId}${supplier ? ` - ${supplier}` : ''}`,
                costPrice: item.costPrice,
                createdBy: userId,
            });

            const saved = await movement.save();
            movements.push(saved);

            // Update stock balance
            await this.updateStockBalance(item.variantId, locationId, Math.abs(item.quantity));

            // Audit log
            await this.auditLogsService.create({
                entityType: 'stock_receipt',
                entityId: saved._id.toString(),
                action: 'create',
                userId,
                oldValue: null,
                newValue: saved.toObject(),
            });
        }

        return {
            receiptId,
            documentNo,
            supplier,
            locationId,
            items: movements,
            totalItems: items.length,
            totalQuantity: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        };
    }

    // Transfer
    async createTransfer(transferDto: any, userId: string): Promise<any> {
        const { fromLocationId, toLocationId, items } = transferDto;
        const transferId = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const outMovements = [];
        const inMovements = [];

        for (const item of items) {
            // Check stock availability
            const currentStock = await this.getStock(item.variantId, fromLocationId);
            if (currentStock < item.quantity) {
                throw new BadRequestException(
                    `${item.variantName}: Kifayət qədər ehtiyat yoxdur. Mövcud: ${currentStock}, Tələb: ${item.quantity}`
                );
            }

            // Create OUT movement
            const outMovement = new this.movementModel({
                productId: item.variantId,
                locationId: fromLocationId,
                qty: -Math.abs(item.quantity),
                type: MovementType.TRANSFER_OUT,
                refType: 'transfer',
                refId: transferId,
                transferId,
                note: `Transfer: ${transferId}`,
                createdBy: userId,
            });

            const savedOut = await outMovement.save();
            outMovements.push(savedOut);

            // Update FROM location balance
            await this.updateStockBalance(item.variantId, fromLocationId, -Math.abs(item.quantity));

            // Create IN movement
            const inMovement = new this.movementModel({
                productId: item.variantId,
                locationId: toLocationId,
                qty: Math.abs(item.quantity),
                type: MovementType.TRANSFER_IN,
                refType: 'transfer',
                refId: transferId,
                transferId,
                note: `Transfer: ${transferId}`,
                createdBy: userId,
            });

            const savedIn = await inMovement.save();
            inMovements.push(savedIn);

            // Update TO location balance
            await this.updateStockBalance(item.variantId, toLocationId, Math.abs(item.quantity));

            // Audit log
            await this.auditLogsService.create({
                entityType: 'stock_transfer',
                entityId: transferId,
                action: 'create',
                userId,
                oldValue: null,
                newValue: { out: savedOut.toObject(), in: savedIn.toObject() },
            });
        }

        return {
            transferId,
            fromLocationId,
            toLocationId,
            outMovements,
            inMovements,
            totalItems: items.length,
            totalQuantity: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        };
    }

    // Adjustment
    async createAdjustment(adjustmentDto: any, userId: string): Promise<any> {
        const { locationId, items, reason } = adjustmentDto;
        const adjustmentId = `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const movements = [];

        for (const item of items) {
            if (item.quantity === 0) continue; // Skip zero adjustments

            const movement = new this.movementModel({
                productId: item.variantId,
                locationId,
                qty: item.quantity, // Can be positive or negative
                type: MovementType.ADJUSTMENT,
                refType: 'adjustment',
                refId: adjustmentId,
                note: `Düzəliş: ${reason}`,
                createdBy: userId,
            });

            const saved = await movement.save();
            movements.push(saved);

            // Update stock balance
            await this.updateStockBalance(item.variantId, locationId, item.quantity);

            // Audit log
            await this.auditLogsService.create({
                entityType: 'stock_adjustment',
                entityId: saved._id.toString(),
                action: 'create',
                userId,
                oldValue: null,
                newValue: { ...saved.toObject(), reason },
            });
        }

        return {
            adjustmentId,
            locationId,
            reason,
            movements,
            totalItems: movements.length,
        };
    }

    // Stocktake - Start
    async startStocktake(stocktakeDto: any, userId: string): Promise<any> {
        const { locationId } = stocktakeDto;
        const stocktakeId = `STK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Get current stock balances for the location
        const currentStock = await this.balanceModel
            .find({ locationId })
            .populate('productId')
            .exec();

        await this.auditLogsService.create({
            entityType: 'stocktake',
            entityId: stocktakeId,
            action: 'start',
            userId,
            oldValue: null,
            newValue: { locationId, startedAt: new Date() },
        });

        return {
            stocktakeId,
            locationId,
            currentStock: currentStock.map(item => ({
                variantId: item.productId._id,
                variantName: item.productId.name,
                systemQuantity: item.quantity,
            })),
            startedAt: new Date(),
        };
    }

    // Stocktake - Finalize
    async finalizeStocktake(stocktakeDto: any, userId: string): Promise<any> {
        const { locationId, items, reason } = stocktakeDto;
        const stocktakeId = `STK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const adjustments = [];
        let totalDifference = 0;

        for (const item of items) {
            // Get current system quantity
            const currentStock = await this.getStock(item.variantId, locationId);
            const countedQty = item.quantity;
            const difference = countedQty - currentStock;

            if (difference !== 0) {
                // Create adjustment movement for the difference
                const movement = new this.movementModel({
                    productId: item.variantId,
                    locationId,
                    qty: difference,
                    type: MovementType.ADJUSTMENT,
                    refType: 'stocktake',
                    refId: stocktakeId,
                    note: `Sayım: ${reason} (Sistem: ${currentStock}, Sayılmış: ${countedQty}, Fərq: ${difference})`,
                    createdBy: userId,
                });

                const saved = await movement.save();
                adjustments.push({
                    ...saved.toObject(),
                    systemQty: currentStock,
                    countedQty,
                    difference,
                });

                // Update stock balance
                await this.updateStockBalance(item.variantId, locationId, difference);

                totalDifference += Math.abs(difference);
            }
        }

        // Audit log
        await this.auditLogsService.create({
            entityType: 'stocktake',
            entityId: stocktakeId,
            action: 'finalize',
            userId,
            oldValue: null,
            newValue: {
                locationId,
                reason,
                adjustments: adjustments.length,
                totalDifference,
                finalizedAt: new Date(),
            },
        });

        return {
            stocktakeId,
            locationId,
            reason,
            adjustments,
            totalAdjustments: adjustments.length,
            totalDifference,
            finalizedAt: new Date(),
        };
    }

    // Helper: Update stock balance
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

    // Helper: Get current stock
    private async getStock(productId: string, locationId: string): Promise<number> {
        const balance = await this.balanceModel.findOne({ productId, locationId }).exec();
        return balance ? balance.quantity : 0;
    }
}
