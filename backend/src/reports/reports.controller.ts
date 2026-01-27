import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stock-by-location')
  getStockByLocation(@Query('locationId') locationId: string) {
    return this.reportsService.getStockByLocation(locationId);
  }

  @Get('low-stock')
  getLowStock(@Query('threshold') threshold?: string) {
    return this.reportsService.getLowStock(threshold ? parseInt(threshold, 10) : 10);
  }

  @Get('sales')
  getSalesReport(@Query() query: any) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('sales-by-cashier')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  getSalesByCashier(@Query() query: any) {
    return this.reportsService.getSalesByCashier(
      query.cashierId,
      query.dateFrom ? new Date(query.dateFrom) : undefined,
      query.dateTo ? new Date(query.dateTo) : undefined,
    );
  }

  @Get('sales-by-store')
  getSalesByStore(@Query() query: any) {
    return this.reportsService.getSalesByStore(
      query.locationId,
      query.dateFrom ? new Date(query.dateFrom) : undefined,
      query.dateTo ? new Date(query.dateTo) : undefined,
    );
  }

  @Get('top-debtors')
  getTopDebtors(@Query('limit') limit?: string) {
    return this.reportsService.getTopDebtors(limit ? parseInt(limit, 10) : 10);
  }

  @Get('cash-closing-history')
  getCashClosingHistory(@Query() query: any) {
    return this.reportsService.getCashClosingHistory(query);
  }
}


