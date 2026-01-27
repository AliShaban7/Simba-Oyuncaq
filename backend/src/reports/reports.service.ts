import { Injectable } from '@nestjs/common';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { SalesService } from '../sales/sales.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class ReportsService {
  constructor(
    private stockMovementsService: StockMovementsService,
    private salesService: SalesService,
    private customersService: CustomersService,
  ) {}

  async getStockByLocation(locationId: string) {
    return this.stockMovementsService.getStockByLocation(locationId);
  }

  async getLowStock(threshold: number = 10) {
    return this.stockMovementsService.getLowStock(threshold);
  }

  async getSalesReport(filters: any) {
    return this.salesService.findAll(filters);
  }

  async getSalesByCashier(cashierId: string, dateFrom?: Date, dateTo?: Date) {
    return this.salesService.findAll({
      cashierId,
      dateFrom,
      dateTo,
    });
  }

  async getSalesByStore(locationId: string, dateFrom?: Date, dateTo?: Date) {
    return this.salesService.findAll({
      locationId,
      dateFrom,
      dateTo,
    });
  }

  async getTopDebtors(limit: number = 10) {
    return this.customersService.getTopDebtors(limit);
  }

  async getCashClosingHistory(filters: any) {
    return this.salesService.getCashClosings(filters);
  }
}


