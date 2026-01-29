import { Controller, Get, Post, Body, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
    constructor(private readonly stockService: StockService) { }

    // Get stock balances
    @Get('balances')
    getBalances(@Query('locationId') locationId?: string) {
        return this.stockService.getBalances(locationId);
    }

    // Get stock movements
    @Get('movements')
    getMovements(
        @Query('locationId') locationId?: string,
        @Query('variantId') variantId?: string,
        @Query('limit') limit?: string,
    ) {
        return this.stockService.getMovements({
            locationId,
            variantId,
            limit: limit ? parseInt(limit, 10) : 50,
        });
    }

    // Receipt (Stock In)
    @Post('receipts')
    @UseGuards(RolesGuard)
    @Roles('admin', 'manager', 'warehouse')
    createReceipt(@Body() receiptDto: any, @Request() req) {
        if (!receiptDto.locationId || !receiptDto.items || receiptDto.items.length === 0) {
            throw new BadRequestException('Lokasiya və məhsullar tələb olunur');
        }
        return this.stockService.createReceipt(receiptDto, req.user.userId);
    }

    // Transfer
    @Post('transfers')
    @UseGuards(RolesGuard)
    @Roles('admin', 'manager', 'warehouse')
    createTransfer(@Body() transferDto: any, @Request() req) {
        if (!transferDto.fromLocationId || !transferDto.toLocationId || !transferDto.items || transferDto.items.length === 0) {
            throw new BadRequestException('Lokasiyalar və məhsullar tələb olunur');
        }
        if (transferDto.fromLocationId === transferDto.toLocationId) {
            throw new BadRequestException('Eyni lokasiyaya transfer edilə bilməz');
        }
        return this.stockService.createTransfer(transferDto, req.user.userId);
    }

    // Adjustment
    @Post('adjustments')
    @UseGuards(RolesGuard)
    @Roles('admin', 'manager')
    createAdjustment(@Body() adjustmentDto: any, @Request() req) {
        if (!adjustmentDto.locationId || !adjustmentDto.items || adjustmentDto.items.length === 0 || !adjustmentDto.reason) {
            throw new BadRequestException('Lokasiya, məhsullar və səbəb tələb olunur');
        }
        return this.stockService.createAdjustment(adjustmentDto, req.user.userId);
    }

    // Stocktake - Start
    @Post('stocktakes/start')
    @UseGuards(RolesGuard)
    @Roles('admin', 'manager', 'warehouse')
    startStocktake(@Body() stocktakeDto: any, @Request() req) {
        if (!stocktakeDto.locationId) {
            throw new BadRequestException('Lokasiya tələb olunur');
        }
        return this.stockService.startStocktake(stocktakeDto, req.user.userId);
    }

    // Stocktake - Finalize
    @Post('stocktakes/finalize')
    @UseGuards(RolesGuard)
    @Roles('admin', 'manager')
    finalizeStocktake(@Body() stocktakeDto: any, @Request() req) {
        if (!stocktakeDto.locationId || !stocktakeDto.items || !stocktakeDto.reason) {
            throw new BadRequestException('Lokasiya, məhsullar və səbəb tələb olunur');
        }
        return this.stockService.finalizeStocktake(stocktakeDto, req.user.userId);
    }
}
