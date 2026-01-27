import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';
import { LedgerService } from '../ledger/ledger.service';
import { PartyType } from '../ledger/schemas/ledger-entry.schema';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    private ledgerService: LedgerService,
  ) {}

  async create(createSupplierDto: any): Promise<SupplierDocument> {
    const supplier = new this.supplierModel(createSupplierDto);
    return supplier.save();
  }

  async findAll(filters?: any): Promise<SupplierDocument[]> {
    const query: any = {};
    if (filters?.active !== undefined) {
      query.active = filters.active;
    }
    if (filters?.search) {
      query.$text = { $search: filters.search };
    }
    const suppliers = await this.supplierModel.find(query).exec();
    
    // Calculate balances from ledger
    for (const supplier of suppliers) {
      supplier.balance = await this.ledgerService.getBalance(PartyType.SUPPLIER, supplier._id.toString());
    }
    
    return suppliers;
  }

  async findById(id: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new NotFoundException('Təchizatçı tapılmadı');
    }
    supplier.balance = await this.ledgerService.getBalance(PartyType.SUPPLIER, id);
    return supplier;
  }

  async update(id: string, updateSupplierDto: any): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findByIdAndUpdate(id, updateSupplierDto, { new: true }).exec();
    if (!supplier) {
      throw new NotFoundException('Təchizatçı tapılmadı');
    }
    supplier.balance = await this.ledgerService.getBalance(PartyType.SUPPLIER, id);
    return supplier;
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.supplierModel.findByIdAndUpdate(id, { active: false }, { new: true }).exec();
    if (!supplier) {
      throw new NotFoundException('Təchizatçı tapılmadı');
    }
  }
}

