import { useEffect, useState, useRef } from 'react';
import api from '../api/api';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface CartItem {
  productId: string;
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'mixed'>('cash');
  const [paymentBreakdown, setPaymentBreakdown] = useState({ cash: 0, card: 0, transfer: 0 });
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations', { params: { type: 'store' } });
      setLocations(response.data);
      if (response.data.length > 0) {
        setSelectedLocation(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const [showBarcodeNotFoundModal, setShowBarcodeNotFoundModal] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState('');
  const { user } = useAuthStore();

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const barcodeValue = barcodeInput.trim();
    setBarcodeInput('');

    try {
      const response = await api.get(`/barcodes/lookup/${barcodeValue}`);
      const { variant, barcode } = response.data;
      
      // Add variant to cart
      const product = variant.productId || variant;
      addToCart({
        ...product,
        variantId: variant._id,
        variant: variant,
        barcode: barcode.value,
      });
      
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        // Barcode not found - show modal
        setNotFoundBarcode(barcodeValue);
        setShowBarcodeNotFoundModal(true);
      } else {
        alert(error.response?.data?.message || 'Xəta baş verdi');
      }
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  };

  const addToCart = (productOrVariant: any) => {
    // Handle both product and variant
    const variant = productOrVariant.variant || productOrVariant;
    const product = variant.productId || productOrVariant;
    const variantId = variant._id || productOrVariant.variantId;
    const productId = product._id || productOrVariant._id;
    const productName = product.name || variant.productId?.name || productOrVariant.name;
    const salePrice = variant.salePrice || product.salePrice || productOrVariant.salePrice;

    const existingItem = cart.find(
      (item) => item.productId === productId && item.variantId === variantId
    );
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice - item.discount }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId,
          variantId,
          productName,
          quantity: 1,
          unitPrice: salePrice,
          discount: 0,
          total: salePrice,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number, variantId?: string) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId && (variantId ? item.variantId === variantId : true)) {
            const newQuantity = Math.max(0, item.quantity + delta);
            if (newQuantity === 0) return null;
            return {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.unitPrice - item.discount,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(cart.filter((item) => 
      !(item.productId === productId && (variantId ? item.variantId === variantId : true))
    ));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Səbət boşdur');
      return;
    }
    if (!selectedLocation) {
      alert('Lokasiya seçin');
      return;
    }

    try {
      // Map cart items to sale items format
      const saleItems = cart.map((item) => ({
        productId: item.variantId || item.productId, // Use variantId if available
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      }));

      const saleData: any = {
        locationId: selectedLocation,
        items: saleItems,
        subtotal,
        total,
        paymentMethod,
        paidAmount: paymentMethod === 'cash' ? total : paidAmount,
        remainingDebt: paymentMethod === 'cash' ? 0 : Math.max(0, total - paidAmount),
      };

      if (paymentMethod === 'mixed') {
        saleData.paymentBreakdown = paymentBreakdown;
      }

      if (customer) {
        saleData.customerId = customer._id;
      }

      await api.post('/sales', saleData);
      alert('Satış uğurla tamamlandı!');
      setCart([]);
      setCustomer(null);
      setCustomerPhone('');
      setPaidAmount(0);
      setPaymentBreakdown({ cash: 0, card: 0, transfer: 0 });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xəta baş verdi');
    }
  };

  const handleCustomerSearch = async () => {
    if (!customerPhone.trim()) return;
    try {
      const response = await api.get(`/customers/phone/${customerPhone}`);
      setCustomer(response.data);
    } catch (error) {
      setCustomer(null);
    }
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-secondary mb-6">POS</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleBarcodeSubmit} className="mb-4">
              <div className="flex gap-2">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Barkod skan edin və ya daxil edin..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90"
                >
                  Əlavə et
                </button>
              </div>
            </form>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mağaza</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Müştəri (İstəyə bağlı)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Telefon nömrəsi"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={handleCustomerSearch}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Axtar
                </button>
              </div>
              {customer && (
                <p className="mt-2 text-sm text-green-600">Müştəri: {customer.name}</p>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Səbət</h3>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Səbət boşdur</p>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          {item.unitPrice.toFixed(2)} AZN x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, -1, item.variantId)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1, item.variantId)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="w-24 text-right font-semibold">{item.total.toFixed(2)} AZN</span>
                        <button
                          onClick={() => removeFromCart(item.productId, item.variantId)}
                          className="p-1 text-red-600 hover:text-red-800 ml-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="text-xl font-semibold text-secondary mb-4">Ödəniş</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ödəniş üsulu</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="cash">Nağd</option>
                <option value="card">Kart</option>
                <option value="transfer">Köçürmə</option>
                <option value="mixed">Qarışıq</option>
              </select>
            </div>

            {paymentMethod === 'mixed' && (
              <div className="space-y-2 mb-4">
                <div>
                  <label className="block text-xs text-gray-600">Nağd</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentBreakdown.cash}
                    onChange={(e) =>
                      setPaymentBreakdown({ ...paymentBreakdown, cash: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Kart</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentBreakdown.card}
                    onChange={(e) =>
                      setPaymentBreakdown({ ...paymentBreakdown, card: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Köçürmə</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentBreakdown.transfer}
                    onChange={(e) =>
                      setPaymentBreakdown({ ...paymentBreakdown, transfer: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                  />
                </div>
              </div>
            )}

            {customer && paymentMethod !== 'cash' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ödənilən məbləğ</label>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {paidAmount < total && (
                  <p className="mt-1 text-sm text-orange-600">
                    Qalan borc: {(total - paidAmount).toFixed(2)} AZN
                  </p>
                )}
              </div>
            )}

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Cəmi:</span>
                <span className="text-2xl font-bold text-secondary">{total.toFixed(2)} AZN</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-primary text-white py-4 rounded-lg text-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Ödəniş Et
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Not Found Modal */}
      {showBarcodeNotFoundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-secondary mb-4">Barkod Tapılmadı</h2>
            <p className="mb-4 text-gray-700">
              <strong>Barkod:</strong> <span className="font-mono">{notFoundBarcode}</span>
            </p>
            <p className="mb-6 text-gray-600">
              Bu barkod sistemdə tapılmadı. Nə etmək istəyirsiniz?
            </p>
            <div className="space-y-3">
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <>
                  <button
                    onClick={() => {
                      setShowBarcodeNotFoundModal(false);
                      window.location.href = '/products?assignBarcode=' + notFoundBarcode;
                    }}
                    className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-opacity-90"
                  >
                    Mövcud məhsula təyin et
                  </button>
                  <button
                    onClick={() => {
                      setShowBarcodeNotFoundModal(false);
                      window.location.href = '/products?newBarcode=' + notFoundBarcode;
                    }}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                  >
                    Yeni məhsul yarat
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowBarcodeNotFoundModal(false);
                  setNotFoundBarcode('');
                  if (barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                  }
                }}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Ləğv et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

