import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  create(@Body() createLocationDto: any, @Request() req) {
    return this.locationsService.create(createLocationDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.locationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateLocationDto: any, @Request() req) {
    return this.locationsService.update(id, updateLocationDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string, @Request() req) {
    return this.locationsService.remove(id, req.user.userId);
  }
}


