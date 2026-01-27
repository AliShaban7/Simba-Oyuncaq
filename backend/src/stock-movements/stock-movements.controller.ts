import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard)
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'warehouse')
  create(@Body() createMovementDto: any, @Request() req) {
    return this.stockMovementsService.create(createMovementDto, req.user.userId);
  }

  @Post('transfer')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'warehouse')
  createTransfer(@Body() transferDto: any, @Request() req) {
    return this.stockMovementsService.createTransfer(
      transferDto.productId,
      transferDto.fromLocationId,
      transferDto.toLocationId,
      transferDto.qty,
      req.user.userId,
      transferDto.note,
    );
  }

  @Get('stock/:productId/:locationId')
  getStock(@Param('productId') productId: string, @Param('locationId') locationId: string) {
    return this.stockMovementsService.getStock(productId, locationId);
  }

  @Get('by-location/:locationId')
  getStockByLocation(@Param('locationId') locationId: string) {
    return this.stockMovementsService.getStockByLocation(locationId);
  }

  @Get('by-product/:productId')
  getStockByProduct(@Param('productId') productId: string) {
    return this.stockMovementsService.getStockByProduct(productId);
  }

  @Get('low-stock')
  getLowStock(@Query('threshold') threshold?: string) {
    return this.stockMovementsService.getLowStock(threshold ? parseInt(threshold, 10) : 10);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.stockMovementsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockMovementsService.findById(id);
  }
}


