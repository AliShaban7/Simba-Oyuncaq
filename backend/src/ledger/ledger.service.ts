import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LedgerEntry, LedgerEntryDocument, PartyType } from './schemas/ledger-entry.schema';

@Injectable()
export class LedgerService {
  constructor(
    @InjectModel(LedgerEntry.name) private ledgerModel: Model<LedgerEntryDocument>,
  ) {}

  async create(createLedgerDto: any, userId: string): Promise<LedgerEntryDocument> {
    const entry = new this.ledgerModel({
      ...createLedgerDto,
      createdBy: userId,
    });
    return entry.save();
  }

  async getBalance(partyType: PartyType, partyId: string): Promise<number> {
    const entries = await this.ledgerModel
      .find({ partyType, partyId })
      .exec();
    
    return entries.reduce((sum, entry) => sum + entry.amount, 0);
  }

  async getEntries(partyType?: PartyType, partyId?: string): Promise<LedgerEntryDocument[]> {
    const query: any = {};
    if (partyType) {
      query.partyType = partyType;
    }
    if (partyId) {
      query.partyId = partyId;
    }
    return this.ledgerModel
      .find(query)
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async recordPayment(
    partyType: PartyType,
    partyId: string,
    amount: number,
    userId: string,
    note?: string,
  ): Promise<LedgerEntryDocument> {
    // Payment reduces debt, so negative amount for customers, positive for suppliers
    const entryAmount = partyType === PartyType.CUSTOMER ? -Math.abs(amount) : Math.abs(amount);
    
    return this.create({
      partyType,
      partyId,
      amount: entryAmount,
      currency: 'AZN',
      type: 'payment',
      note,
    }, userId);
  }
}


