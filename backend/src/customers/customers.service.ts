import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { LedgerService } from '../ledger/ledger.service';
import { PartyType } from '../ledger/schemas/ledger-entry.schema';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    private ledgerService: LedgerService,
  ) {}

  async create(createCustomerDto: any): Promise<CustomerDocument> {
    const customer = new this.customerModel(createCustomerDto);
    return customer.save();
  }

  async findAll(filters?: any): Promise<CustomerDocument[]> {
    const query: any = {};
    if (filters?.active !== undefined) {
      query.active = filters.active;
    }
    if (filters?.search) {
      query.$text = { $search: filters.search };
    }
    const customers = await this.customerModel.find(query).exec();
    
    // Calculate balances from ledger
    for (const customer of customers) {
      customer.balance = await this.ledgerService.getBalance(PartyType.CUSTOMER, customer._id.toString());
    }
    
    return customers;
  }

  async findById(id: string): Promise<CustomerDocument> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException('Müştəri tapılmadı');
    }
    customer.balance = await this.ledgerService.getBalance(PartyType.CUSTOMER, id);
    return customer;
  }

  async findByPhone(phone: string): Promise<CustomerDocument | null> {
    return this.customerModel.findOne({ phone }).exec();
  }

  async update(id: string, updateCustomerDto: any): Promise<CustomerDocument> {
    const customer = await this.customerModel.findByIdAndUpdate(id, updateCustomerDto, { new: true }).exec();
    if (!customer) {
      throw new NotFoundException('Müştəri tapılmadı');
    }
    customer.balance = await this.ledgerService.getBalance(PartyType.CUSTOMER, id);
    return customer;
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerModel.findByIdAndUpdate(id, { active: false }, { new: true }).exec();
    if (!customer) {
      throw new NotFoundException('Müştəri tapılmadı');
    }
  }

  async getTopDebtors(limit: number = 10): Promise<CustomerDocument[]> {
    const customers = await this.customerModel.find({ active: true }).exec();
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const balance = await this.ledgerService.getBalance(PartyType.CUSTOMER, customer._id.toString());
        return { ...customer.toObject(), balance };
      })
    );
    return customersWithBalance
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit) as any[];
  }
}

