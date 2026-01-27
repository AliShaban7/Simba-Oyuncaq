import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Delete } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: any, @Request() req) {
    return this.salesService.create(createSaleDto, req.user.userId, req.user.role);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.salesService.findAll(query);
  }

  @Get('day-sales')
  getDaySales(@Query('locationId') locationId: string, @Query('date') date: string) {
    return this.salesService.getDaySales(locationId, new Date(date));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findById(id);
  }

  @Get('sale-no/:saleNo')
  findBySaleNo(@Param('saleNo') saleNo: string) {
    return this.salesService.findBySaleNo(saleNo);
  }

  @Post(':id/void')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  voidSale(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
    return this.salesService.voidSale(id, body.reason, req.user.userId, req.user.role);
  }

  @Post('cash-closing')
  createCashClosing(@Body() createDto: any, @Request() req) {
    return this.salesService.createCashClosing(createDto, req.user.userId);
  }

  @Get('cash-closings')
  getCashClosings(@Query() query: any) {
    return this.salesService.getCashClosings(query);
  }
}


