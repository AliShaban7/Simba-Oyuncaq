import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BarcodesService } from './barcodes.service';
import { Barcode, BarcodeType } from './schemas/barcode.schema';
import { CountersService } from '../counters/counters.service';
import { ProductVariantsService } from '../product-variants/product-variants.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('BarcodesService', () => {
  let service: BarcodesService;
  let barcodeModel: Model<Barcode>;
  let countersService: CountersService;

  const mockBarcodeModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  const mockCountersService = {
    getNextSequence: jest.fn(),
  };

  const mockProductVariantsService = {
    findById: jest.fn(),
  };

  const mockAuditLogsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BarcodesService,
        {
          provide: getModelToken(Barcode.name),
          useValue: mockBarcodeModel,
        },
        {
          provide: CountersService,
          useValue: mockCountersService,
        },
        {
          provide: ProductVariantsService,
          useValue: mockProductVariantsService,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    service = module.get<BarcodesService>(BarcodesService);
    barcodeModel = module.get<Model<Barcode>>(getModelToken(Barcode.name));
    countersService = module.get<CountersService>(CountersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateInternalBarcode', () => {
    it('should generate unique internal barcode', async () => {
      const variantId = 'variant123';
      const userId = 'user123';

      mockProductVariantsService.findById.mockResolvedValue({ _id: variantId });
      mockBarcodeModel.findOne.mockResolvedValueOnce(null); // No existing internal
      mockBarcodeModel.findOne.mockResolvedValueOnce(null); // No existing primary
      mockCountersService.getNextSequence.mockResolvedValue(1);
      mockBarcodeModel.create.mockResolvedValue({
        _id: 'barcode123',
        value: 'SIMBA-00000001',
        type: BarcodeType.INTERNAL,
        variantId,
        isPrimary: true,
        save: jest.fn().mockResolvedValue(true),
      });

      const result = await service.generateInternalBarcode(variantId, userId);

      expect(result.value).toMatch(/^SIMBA-\d{8}$/);
      expect(mockCountersService.getNextSequence).toHaveBeenCalledWith('internal_barcode_seq');
    });

    it('should throw error if variant already has internal barcode', async () => {
      const variantId = 'variant123';
      const userId = 'user123';

      mockProductVariantsService.findById.mockResolvedValue({ _id: variantId });
      mockBarcodeModel.findOne.mockResolvedValue({ _id: 'existing' }); // Existing internal

      await expect(service.generateInternalBarcode(variantId, userId)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create barcode and set as primary if specified', async () => {
      const createDto = {
        value: '1234567890123',
        type: BarcodeType.EAN13,
        variantId: 'variant123',
        isPrimary: true,
      };
      const userId = 'user123';

      mockBarcodeModel.findOne.mockResolvedValue(null); // No existing barcode
      mockProductVariantsService.findById.mockResolvedValue({ _id: 'variant123' });
      mockBarcodeModel.updateMany.mockResolvedValue({});
      mockBarcodeModel.create.mockResolvedValue({
        ...createDto,
        _id: 'barcode123',
        createdBy: userId,
        save: jest.fn().mockResolvedValue(true),
      });

      const result = await service.create(createDto, userId);

      expect(mockBarcodeModel.updateMany).toHaveBeenCalledWith(
        { variantId: createDto.variantId, isPrimary: true },
        { $set: { isPrimary: false } },
      );
    });
  });
});


