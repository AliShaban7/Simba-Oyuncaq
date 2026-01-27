import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BarcodesService } from './barcodes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('barcodes')
export class BarcodesController {
  constructor(private readonly barcodesService: BarcodesService) {}

  @Get('lookup/:value')
  lookup(@Param('value') value: string) {
    return this.barcodesService.lookup(value);
  }

  @Get('value/:value')
  @UseGuards(JwtAuthGuard)
  findByValue(@Param('value') value: string) {
    return this.barcodesService.findByValue(value);
  }

  @Get('variant/:variantId')
  @UseGuards(JwtAuthGuard)
  findByVariant(@Param('variantId') variantId: string) {
    return this.barcodesService.findByVariant(variantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  create(@Body() createBarcodeDto: any, @Request() req) {
    return this.barcodesService.create(createBarcodeDto, req.user.userId);
  }

  @Post('generate/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  generateInternal(@Param('variantId') variantId: string, @Request() req) {
    return this.barcodesService.generateInternalBarcode(variantId, req.user.userId);
  }

  @Post(':id/set-primary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  setPrimary(@Param('id') id: string, @Request() req) {
    return this.barcodesService.setPrimary(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  remove(@Param('id') id: string, @Request() req) {
    return this.barcodesService.remove(id, req.user.userId);
  }
}
