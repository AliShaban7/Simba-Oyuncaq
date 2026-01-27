import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: any) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.customersService.findAll(query);
  }

  @Get('top-debtors')
  getTopDebtors(@Query('limit') limit?: string) {
    return this.customersService.getTopDebtors(limit ? parseInt(limit, 10) : 10);
  }

  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: any) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}


