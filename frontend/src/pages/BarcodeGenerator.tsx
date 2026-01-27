import { useEffect, useState, useRef } from 'react';
import api from '../api/api';
import { Search, Printer, Plus, X, FileDown } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/print.css';

interface Product {
  _id: string;
  name: string;
  category?: string;
  brand?: string;
  salePrice: number;
}

interface ProductVariant {
  _id: string;
  productId: any;
  attributes: any;
  salePrice: number;
  costPrice: number;
  active: boolean;
}

interface Barcode {
  _id: string;
  value: string;
  type: 'EAN13' | 'UPC' | 'CODE128' | 'INTERNAL';
  variantId: string;
  isPrimary: boolean;
}

interface LabelItem {
  variant: ProductVariant;
  barcode: Barcode;
  quantity: number;
}

export default function BarcodeGenerator() {
  const [_products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<LabelItem[]>([]);
  const [printerModel, setPrinterModel] = useState<'58mm' | '80mm'>('58mm');
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showPrice, setShowPrice] = useState(true);
  const [loading, setLoading] = useState(true);
  const [barcodeType, _setBarcodeType] = useState<'all' | 'primary' | 'internal' | 'manufacturer'>('primary');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchVariants();
  }, []);

  useEffect(() => {
    // Generate barcodes when selected labels change
    const generateBarcodes = () => {
      selectedLabels.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          const canvasId = `barcode-${item.variant._id}-${item.barcode._id}-${i}`;
          const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
          if (canvas && item.barcode.value) {
            try {
              // Clear canvas first
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
              
              // Determine barcode format based on type
              let format = 'CODE128';
              if (item.barcode.type === 'EAN13' && /^\d{13}$/.test(item.barcode.value)) {
                format = 'EAN13';
              } else if (item.barcode.type === 'UPC' && /^\d{12}$/.test(item.barcode.value)) {
                format = 'UPC';
              }
              
              JsBarcode(canvas, item.barcode.value, {
                format: format as any,
                width: labelSize === 'small' ? 1 : labelSize === 'medium' ? 2 : 3,
                height: labelSize === 'small' ? 40 : labelSize === 'medium' ? 60 : 80,
                displayValue: true,
                fontSize: labelSize === 'small' ? 12 : labelSize === 'medium' ? 14 : 16,
                margin: 5,
              });
            } catch (error) {
              console.error('Barcode generation error:', error);
            }
          }
        }
      });
    };
    
    setTimeout(generateBarcodes, 200);
  }, [selectedLabels, labelSize]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', { params: { active: true } });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await api.get('/product-variants', { params: { active: true } });
      setVariants(response.data);
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  const fetchVariantBarcodes = async (variantId: string): Promise<Barcode[]> => {
    try {
      const response = await api.get(`/barcodes/variant/${variantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching barcodes:', error);
      return [];
    }
  };

  const addVariant = async (variant: ProductVariant) => {
    // Fetch barcodes for this variant
    const barcodes = await fetchVariantBarcodes(variant._id);
    
    if (barcodes.length === 0) {
      alert('Bu variant üçün barkod yoxdur. Əvvəlcə barkod əlavə edin.');
      return;
    }

    // Filter barcodes based on selected type
    let availableBarcodes = barcodes;
    if (barcodeType === 'primary') {
      availableBarcodes = barcodes.filter(b => b.isPrimary);
    } else if (barcodeType === 'internal') {
      availableBarcodes = barcodes.filter(b => b.type === 'INTERNAL');
    } else if (barcodeType === 'manufacturer') {
      availableBarcodes = barcodes.filter(b => b.type === 'EAN13' || b.type === 'UPC');
    }

    if (availableBarcodes.length === 0) {
      alert('Seçilmiş tip üçün barkod tapılmadı.');
      return;
    }

    // Use first available barcode
    const barcode = availableBarcodes[0];
    
    const existing = selectedLabels.find((item) => 
      item.variant._id === variant._id && item.barcode._id === barcode._id
    );
    
    if (existing) {
      setSelectedLabels(
        selectedLabels.map((item) =>
          item.variant._id === variant._id && item.barcode._id === barcode._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedLabels([...selectedLabels, { variant, barcode, quantity: 1 }]);
    }
  };

  const removeLabel = (variantId: string, barcodeId: string) => {
    setSelectedLabels(selectedLabels.filter(
      (item) => !(item.variant._id === variantId && item.barcode._id === barcodeId)
    ));
  };

  const updateQuantity = (variantId: string, barcodeId: string, quantity: number) => {
    if (quantity <= 0) {
      removeLabel(variantId, barcodeId);
      return;
    }
    setSelectedLabels(
      selectedLabels.map((item) =>
        item.variant._id === variantId && item.barcode._id === barcodeId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Simba Barcode Labels',
    pageStyle: `
      @page {
        size: ${printerModel === '58mm' ? '58mm' : '80mm'} auto;
        margin: 0;
        padding: 0;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        .print-label {
          width: ${printerModel === '58mm' ? '58mm' : '80mm'} !important;
          max-width: ${printerModel === '58mm' ? '58mm' : '80mm'} !important;
          margin: 0;
          padding: 2mm;
          page-break-after: always;
          page-break-inside: avoid;
          border: 1px solid #000;
          box-sizing: border-box;
        }
        canvas {
          max-width: 100% !important;
          height: auto !important;
        }
      }
    `,
  } as any);

  const handleDownloadPDF = async () => {
    if (!printRef.current || selectedLabels.length === 0) return;

    try {
      // Show loading
      const loadingMsg = document.createElement('div');
      loadingMsg.textContent = 'PDF yaradılır...';
      loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#F4A300;color:white;padding:20px;border-radius:8px;z-index:9999;font-weight:bold;';
      document.body.appendChild(loadingMsg);

      // Temporarily show the print container for rendering
      const printContainerWrapper = document.getElementById('print-container-wrapper');
      if (printContainerWrapper) {
        const originalDisplay = printContainerWrapper.style.display;
        const originalPosition = printContainerWrapper.style.position;
        const originalLeft = printContainerWrapper.style.left;
        const originalWidth = printContainerWrapper.style.width;
        
        printContainerWrapper.style.display = 'block';
        printContainerWrapper.style.position = 'absolute';
        printContainerWrapper.style.left = '-9999px';
        printContainerWrapper.style.width = printerModel === '58mm' ? '58mm' : '80mm';
        printContainerWrapper.style.backgroundColor = 'white';

        // Wait for barcodes to render
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [printerModel === '58mm' ? 58 : 80, 297], // A4 height for multiple labels
        });

        const labels = printRef.current?.querySelectorAll('.print-label');
        if (!labels || labels.length === 0) {
          document.body.removeChild(loadingMsg);
          alert('Etiket tapılmadı');
          return;
        }

        const labelWidth = printerModel === '58mm' ? 58 : 80;
        const pageHeight = 297; // A4 height in mm
        let yPosition = 0;
        const margin = 5;

        for (let i = 0; i < labels.length; i++) {
          const label = labels[i] as HTMLElement;
          
          // Convert label to canvas
          const canvas = await html2canvas(label, {
            scale: 3,
            backgroundColor: '#ffffff',
            width: labelWidth * 3.779527559, // Convert mm to pixels (1mm = 3.779527559px at 96dpi)
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL('image/png', 1.0);
          const imgWidth = labelWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Check if we need a new page
          if (yPosition + imgHeight + margin > pageHeight - margin && i > 0) {
            pdf.addPage();
            yPosition = 0;
          }

          // Add image to PDF
          pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + margin;
        }

        // Restore original display
        printContainerWrapper.style.display = originalDisplay;
        printContainerWrapper.style.position = originalPosition;
        printContainerWrapper.style.left = originalLeft;
        printContainerWrapper.style.width = originalWidth;

        // Remove loading message
        document.body.removeChild(loadingMsg);

        // Download PDF
        const fileName = `Simba-Barcode-Labels-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF yaratma zamanı xəta baş verdi: ' + (error as Error).message);
      // Remove loading message if still present
      const loadingMsg = document.querySelector('div[style*="position:fixed"]');
      if (loadingMsg) {
        document.body.removeChild(loadingMsg as HTMLElement);
      }
    }
  };

  const filteredVariants = variants.filter((v) => {
    const product = v.productId;
    const searchLower = searchTerm.toLowerCase();
    return (
      product?.name?.toLowerCase().includes(searchLower) ||
      product?.category?.toLowerCase().includes(searchLower) ||
      product?.brand?.toLowerCase().includes(searchLower) ||
      Object.values(v.attributes || {}).some(val => 
        String(val).toLowerCase().includes(searchLower)
      )
    );
  });

  const totalLabels = selectedLabels.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary">Barcode Generator - Xprinter</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side - Product Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Məhsul Seçimi</h2>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Məhsul axtarışı..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">Yüklənir...</div>
              ) : filteredVariants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Variant tapılmadı</div>
              ) : (
                <div className="space-y-2">
                  {filteredVariants.map((variant) => {
                    const product = variant.productId || {};
                    const attributes = Object.entries(variant.attributes || {})
                      .map(([key, val]) => `${key}: ${val}`)
                      .join(', ');
                    
                    return (
                      <div
                        key={variant._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={() => addVariant(variant)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-secondary">{product.name || 'Naməlum'}</p>
                          {attributes && (
                            <p className="text-xs text-gray-500 mt-1">{attributes}</p>
                          )}
                          <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            {product.category && <span>Kateqoriya: {product.category}</span>}
                            <span className="font-semibold text-primary">
                              {variant.salePrice.toFixed(2)} AZN
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addVariant(variant);
                          }}
                          className="ml-4 p-2 bg-primary text-white rounded hover:bg-opacity-90"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Labels */}
          {selectedLabels.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-secondary mb-4">
                Seçilmiş Etiketlər ({totalLabels} etiket)
              </h2>
              <div className="space-y-2">
                {selectedLabels.map((item) => {
                  const product = item.variant.productId || {};
                  const attributes = Object.entries(item.variant.attributes || {})
                    .map(([key, val]) => `${key}: ${val}`)
                    .join(', ');
                  
                  return (
                    <div
                      key={`${item.variant._id}-${item.barcode._id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{product.name || 'Naməlum'}</p>
                        {attributes && (
                          <p className="text-xs text-gray-500">{attributes}</p>
                        )}
                        <p className="text-sm text-gray-600 font-mono mt-1">
                          {item.barcode.value} ({item.barcode.type})
                          {item.barcode.isPrimary && (
                            <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded">Əsas</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.variant._id, item.barcode._id, item.quantity - 1)}
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variant._id, item.barcode._id, item.quantity + 1)}
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeLabel(item.variant._id, item.barcode._id)}
                          className="ml-2 p-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right side - Settings & Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Çap Parametrləri</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Printer Modeli
                </label>
                <select
                  value={printerModel}
                  onChange={(e) => setPrinterModel(e.target.value as '58mm' | '80mm')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="58mm">Xprinter 58mm (XP-58, XP-80C)</option>
                  <option value="80mm">Xprinter 80mm (XP-80, XP-370B)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiket Ölçüsü
                </label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="small">Kiçik</option>
                  <option value="medium">Orta</option>
                  <option value="large">Böyük</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPrice"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="showPrice" className="text-sm text-gray-700">
                  Qiyməti göstər
                </label>
              </div>

              <div className="pt-4 border-t space-y-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={selectedLabels.length === 0}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FileDown className="w-5 h-5" />
                  PDF Yüklə ({totalLabels} etiket)
                </button>
                <button
                  onClick={handlePrint}
                  disabled={selectedLabels.length === 0}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Çap Et ({totalLabels} etiket)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview (Hidden until print) */}
      <div className="hidden" id="print-container-wrapper">
        <div ref={printRef} className="print-container" style={{ backgroundColor: 'white' }}>
          {selectedLabels.map((item) =>
            Array.from({ length: item.quantity }).map((_, index) => {
              const product = item.variant.productId || {};
              const attributes = Object.entries(item.variant.attributes || {})
                .map(([key, val]) => `${key}: ${val}`)
                .join(', ');

              return (
                <div
                  key={`${item.variant._id}-${item.barcode._id}-${index}`}
                  className={`print-label ${
                    printerModel === '58mm' ? 'w-58mm' : 'w-80mm'
                  } p-2 border border-gray-300 mb-2`}
                  style={{
                    width: printerModel === '58mm' ? '58mm' : '80mm',
                    minHeight: '40mm',
                    pageBreakAfter: 'always',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <div className="text-center">
                    <p className="font-bold text-sm mb-1">{product.name || 'Naməlum'}</p>
                    {attributes && (
                      <p className="text-xs text-gray-600 mb-1">{attributes}</p>
                    )}
                    {product.brand && (
                      <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                    )}
                    {product.category && (
                      <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                    )}
                    {item.barcode.value && (
                      <canvas
                        id={`barcode-${item.variant._id}-${item.barcode._id}-${index}`}
                        className="mx-auto"
                        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                      ></canvas>
                    )}
                    {showPrice && (
                      <p className="font-bold text-lg mt-2 text-primary">
                        {item.variant.salePrice.toFixed(2)} AZN
                      </p>
                    )}
                    {item.barcode.value && (
                      <p className="text-xs font-mono mt-1">{item.barcode.value}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

