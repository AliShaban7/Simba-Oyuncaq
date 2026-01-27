import { useEffect, useState } from 'react';
import api from '../api/api';
import { Plus, Edit, Trash2, Search, QrCode, Check, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Product {
  _id: string;
  name: string;
  category?: string;
  brand?: string;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number;
  retailPrice?: number;
  notes?: string;
  barcode?: string;
  active: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [priceTab, setPriceTab] = useState<'retail' | 'wholesale'>('retail');
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanBarcode, setScanBarcode] = useState('');
  const { user: _user } = useAuthStore();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Məhsulları yükləmək mümkün olmadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submit triggered');
    
    const formData = new FormData(e.currentTarget);
    const wholesalePrice = formData.get('wholesalePrice') as string;
    const retailPrice = formData.get('retailPrice') as string;
    const notes = formData.get('notes') as string;
    
    const data = {
      name: formData.get('name'),
      brand: formData.get('brand'),
      barcode: formData.get('barcode'),
      costPrice: parseFloat(formData.get('costPrice') as string),
      wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : undefined,
      retailPrice: retailPrice ? parseFloat(retailPrice) : undefined,
      notes: notes ? notes.trim() : undefined,
    };

    console.log('Submitting product data:', data);

    // Basic validation
    if (!data.name) {
      showNotification('Məhsul adı daxil edin', 'error');
      return;
    }
    
    if (!data.costPrice || isNaN(data.costPrice)) {
      showNotification('Alış qiyməti daxil edin', 'error');
      return;
    }

    try {
      let response;
      if (editingProduct) {
        console.log('Updating existing product:', editingProduct._id);
        response = await api.patch(`/products/${editingProduct._id}`, data);
        showNotification('Məhsul uğurla yeniləndi', 'success');
      } else {
        console.log('Creating new product');
        response = await api.post('/products', data);
        showNotification('Məhsul uğurla yaradıldı', 'success');
        
        // Create barcode for new product if provided
        const barcodeValue = formData.get('barcode') as string;
        if (barcodeValue && barcodeValue.trim()) {
          try {
            console.log('Creating barcode:', barcodeValue.trim());
            
            // Create barcode for variant
            const barcodeResponse = await api.post('/barcodes', {
              value: barcodeValue.trim(),
              type: 'INTERNAL',
              productId: response.data._id,
              isPrimary: true,
            });
            
            console.log('Barcode created successfully:', barcodeResponse.data);
          } catch (barcodeError) {
            console.error('Error creating barcode:', barcodeError);
            showNotification('Məhsul yaradıldı amma barkod yaradılarkən xəta baş verdi. Zəhmət olmasa barkodu yenidən cəhd edin.', 'error');
          }
        }
      }
      
      console.log('Product saved successfully:', response.data);
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Product creation error:', error);
      showNotification(error.response?.data?.message || error.response?.data?.error || 'Xəta baş verdi', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Məhsulu silmək istədiyinizə əminsiniz?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-xl lg:text-3xl font-bold text-secondary">Məhsullar</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScanModal(true)}
              className="bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm lg:text-base"
            >
              <QrCode className="w-4 h-4 lg:w-5 lg:h-5" />
              Skan Et
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowModal(true);
              }}
              className="bg-primary text-white px-3 lg:px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 text-sm lg:text-base self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              Yeni Məhsul
            </button>
          </div>
        </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
          <input
            type="text"
            placeholder="Axtarış..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm lg:text-base text-gray-600">Yüklənir...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-secondary text-white sticky top-0 z-10">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ad</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                    Kateqoriya
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                    Alış Qiyməti
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPriceTab('retail')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          priceTab === 'retail'
                            ? 'bg-white text-secondary'
                            : 'text-white hover:bg-white hover:bg-opacity-20'
                        }`}
                      >
                        Pərakəndə
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceTab('wholesale')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          priceTab === 'wholesale'
                            ? 'bg-white text-secondary'
                            : 'text-white hover:bg-white hover:bg-opacity-20'
                        }`}
                      >
                        Topdan
                      </button>
                    </div>
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                    Barkod
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Əməliyyatlar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] lg:max-w-none">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 sm:hidden">{product.category || '-'}</p>
                        <p className="text-xs text-gray-500 md:hidden">Alış: {product.costPrice.toFixed(2)} AZN</p>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 hidden sm:table-cell">
                      <span className="truncate block max-w-[100px] lg:max-w-none">
                        {product.category || '-'}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 hidden md:table-cell">
                      {product.costPrice.toFixed(2)} AZN
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-semibold text-gray-900 text-center">
                      {priceTab === 'retail'
                        ? (product.retailPrice || product.salePrice || 0).toFixed(2)
                        : (product.wholesalePrice || 0).toFixed(2)} AZN
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-900 hidden lg:table-cell">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {product.barcode || '-'}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <div className="flex items-center justify-center gap-1 lg:gap-3">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowModal(true);
                          }}
                          className="text-primary hover:text-opacity-80 p-1"
                          title="Redaktə et"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-secondary mb-6">
              {editingProduct ? 'Məhsulu Redaktə Et' : 'Yeni Məhsul'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Product Information and Pricing */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ad *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingProduct?.name}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marka</label>
                    <input
                      type="text"
                      name="brand"
                      defaultValue={editingProduct?.brand}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Qiymətlər</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600">Alış *</label>
                        <input
                          type="number"
                          step="0.01"
                          name="costPrice"
                          required
                          defaultValue={editingProduct?.costPrice}
                          className="mt-1 block w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Alış"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Pərakəndə</label>
                        <input
                          type="number"
                          step="0.01"
                          name="retailPrice"
                          defaultValue={editingProduct?.retailPrice}
                          className="mt-1 block w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Pərakəndə"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Topdan</label>
                        <input
                          type="number"
                          step="0.01"
                          name="wholesalePrice"
                          defaultValue={editingProduct?.wholesalePrice}
                          className="mt-1 block w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Topdan"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Barcode and Notes */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Barkod</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="barcode"
                        defaultValue={editingProduct?.barcode}
                        placeholder="Məhsul barkodunu daxil edin"
                        className="mt-1 flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // Generate meaningful SMB barcode with product info
                          const productName = (document.querySelector('input[name="name"]') as HTMLInputElement)?.value || '';
                          const brand = (document.querySelector('input[name="brand"]') as HTMLInputElement)?.value || '';
                          const wholesalePrice = (document.querySelector('input[name="wholesalePrice"]') as HTMLInputElement)?.value || '0';
                          const priceDigits = parseFloat(wholesalePrice).toFixed(2).replace('.', '');
                          const randomDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                          const barcode = `SMB-${brand.toUpperCase().slice(0, 3)}${productName.toUpperCase().slice(0, 3)}-${priceDigits}${randomDigits}`;
                          const barcodeInput = document.querySelector('input[name="barcode"]') as HTMLInputElement;
                          if (barcodeInput) {
                            barcodeInput.value = barcode;
                          }
                        }}
                        className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                        title="SMB barkod yaradın (Brand-Product-PriceDigits)"
                      >
                        <Plus className="w-4 h-4" />
                        Generate
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Qeyd</label>
                    <textarea
                      name="notes"
                      defaultValue={editingProduct?.notes || ''}
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Əlavə qeydlər..."
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
                >
                  Saxla
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Ləğv et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-secondary mb-4">Barkod Skan Et</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Barkod</label>
                <input
                  type="text"
                  value={scanBarcode}
                  onChange={(e) => setScanBarcode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Barkodu skan edin və ya daxil edin"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (scanBarcode.trim()) {
                      // Search for existing product
                      const existingProduct = products.find(p => p.barcode === scanBarcode.trim());
                      if (existingProduct) {
                        showNotification('Bu məhsul artıq mövcuddur', 'error');
                      } else {
                        // Create new product with scanned barcode
                        setEditingProduct(null);
                        setShowModal(true);
                        setShowScanModal(false);
                        // Pre-fill barcode in new product modal
                        setTimeout(() => {
                          const barcodeInput = document.querySelector('input[name="barcode"]') as HTMLInputElement;
                          if (barcodeInput) {
                            barcodeInput.value = scanBarcode.trim();
                            barcodeInput.focus();
                            // Trigger change event to update any listeners
                            barcodeInput.dispatchEvent(new Event('input', { bubbles: true }));
                          }
                        }, 100);
                      }
                    }
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Axtar və Yarat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScanModal(false);
                    setScanBarcode('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Ləğv et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}