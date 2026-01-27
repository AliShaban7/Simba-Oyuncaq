import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('product-variants')
@UseGuards(JwtAuthGuard)
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'warehouse')
  create(@Body() createVariantDto: any, @Request() req) {
    return this.productVariantsService.create(createVariantDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.productVariantsService.findAll(query);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.productVariantsService.findAll({ productId });
  }

  @Get('default/:productId')
  getDefaultVariant(@Param('productId') productId: string) {
    return this.productVariantsService.getDefaultVariant(productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateVariantDto: any, @Request() req) {
    return this.productVariantsService.update(id, updateVariantDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  remove(@Param('id') id: string, @Request() req) {
    return this.productVariantsService.remove(id, req.user.userId);
  }
}


