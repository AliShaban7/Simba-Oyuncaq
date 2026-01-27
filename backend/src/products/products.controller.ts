import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'warehouse')
  create(@Body() createProductDto: any, @Request() req) {
    return this.productsService.create(createProductDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get('barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string) {
    // Redirect to barcode lookup endpoint
    // This endpoint is kept for backward compatibility
    try {
      const response = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/barcodes/lookup/${barcode}`);
      if (response.ok) {
        const data = await response.json();
        return data.variant?.productId || data.variant;
      }
      throw new NotFoundException('Məhsul tapılmadı');
    } catch {
      throw new NotFoundException('Məhsul tapılmadı');
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateProductDto: any, @Request() req) {
    return this.productsService.update(id, updateProductDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.userId);
  }
}

