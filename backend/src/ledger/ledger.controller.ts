import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post()
  create(@Body() createLedgerDto: any, @Request() req) {
    return this.ledgerService.create(createLedgerDto, req.user.userId);
  }

  @Post('payment')
  recordPayment(@Body() paymentDto: any, @Request() req) {
    return this.ledgerService.recordPayment(
      paymentDto.partyType,
      paymentDto.partyId,
      paymentDto.amount,
      req.user.userId,
      paymentDto.note,
    );
  }

  @Get('balance')
  getBalance(@Query('partyType') partyType: string, @Query('partyId') partyId: string) {
    return this.ledgerService.getBalance(partyType as any, partyId);
  }

  @Get()
  getEntries(@Query() query: any) {
    return this.ledgerService.getEntries(query.partyType, query.partyId);
  }
}


