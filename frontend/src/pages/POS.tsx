import { useEffect, useState, useRef } from 'react';
import api from '../api/api';
import { ShoppingCart, Plus, Minus, Trash2, User, CreditCard, Banknote, X, Check, Calculator } from 'lucide-react';
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
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [cashReceived, setCashReceived] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [creditPaidAmount, setCreditPaidAmount] = useState(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchLocations();
    // Focus barcode input on mount
    barcodeInputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F9 - Complete sale
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) setShowCheckoutModal(true);
      }
      // ESC - Clear cart or close modal
      if (e.key === 'Escape') {
        if (showCheckoutModal) {
          setShowCheckoutModal(false);
        } else if (cart.length > 0 && confirm('Səbəti təmizləmək istədiyinizə əminsiniz?')) {
          setCart([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart, showCheckoutModal]);

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

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const searchValue = barcodeInput.trim();
    setBarcodeInput('');
    setShowSearchResults(false);

    try {
      // Try barcode lookup first
      const response = await api.get(`/barcodes/lookup/${searchValue}`);
      const { variant } = response.data;

      const product = variant.productId || variant;
      addToCart({
        ...product,
        variantId: variant._id,
        variant: variant,
      });

      barcodeInputRef.current?.focus();
    } catch (error: any) {
      // If barcode not found, try searching by product name
      if (error.response?.status === 404) {
        try {
          const searchResponse = await api.get('/products', {
            params: { search: searchValue, limit: 5 }
          });

          if (searchResponse.data.length > 0) {
            setProductSearchResults(searchResponse.data);
            setShowSearchResults(true);
          } else {
            alert(`Tapılmadı: ${searchValue}`);
          }
        } catch (searchError) {
          alert(`Tapılmadı: ${searchValue}`);
        }
      } else {
        alert(error.response?.data?.message || 'Xəta baş verdi');
      }
      barcodeInputRef.current?.focus();
    }
  };

  const handleProductSelect = (product: any) => {
    // If product has variants, use the first one
    if (product.variants && product.variants.length > 0) {
      addToCart({
        ...product,
        variantId: product.variants[0]._id,
        variant: product.variants[0],
      });
    } else {
      addToCart(product);
    }
    setShowSearchResults(false);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  const addToCart = (productOrVariant: any) => {
    const variant = productOrVariant.variant || productOrVariant;
    const product = variant.productId || productOrVariant;
    const variantId = variant._id || productOrVariant.variantId;
    const productId = product._id || productOrVariant._id;
    const productName = product.name || variant.productId?.name || productOrVariant.name;
    const salePrice = variant.retailPrice || variant.salePrice || product.retailPrice || product.salePrice || 0;

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
  const change = paymentMethod === 'CASH' ? Math.max(0, cashReceived - total) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedLocation) {
      alert('Lokasiya seçin');
      return;
    }

    if (paymentMethod === 'CASH' && cashReceived < total) {
      alert('Nağd məbləğ kifayət deyil');
      return;
    }

    if (paymentMethod === 'CREDIT' && !customer) {
      alert('Borc üçün müştəri seçin');
      return;
    }

    setProcessing(true);

    try {
      const saleItems = cart.map((item) => ({
        productId: item.variantId || item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      }));

      const paidAmount = paymentMethod === 'CASH' ? total :
        paymentMethod === 'CARD' ? (cardAmount || total) :
          creditPaidAmount;
      const remainingDebt = paymentMethod === 'CREDIT' ? (total - creditPaidAmount) : 0;

      const saleData: any = {
        locationId: selectedLocation,
        items: saleItems,
        subtotal,
        total,
        paymentMethod,
        paidAmount,
        remainingDebt,
      };

      if (customer) {
        saleData.customerId = customer._id;
      }

      await api.post('/sales', saleData);

      // Success - reset everything
      setCart([]);
      setCustomer(null);
      setCustomerSearch('');
      setCashReceived(0);
      setCardAmount(0);
      setCreditPaidAmount(0);
      setShowCheckoutModal(false);
      setPaymentMethod('CASH');

      alert('✓ Satış uğurla tamamlandı!');
      barcodeInputRef.current?.focus();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setProcessing(false);
    }
  };

  const handleCustomerSearch = async () => {
    if (!customerSearch.trim()) return;
    try {
      // Try searching by phone first
      if (/^[0-9+\s()-]+$/.test(customerSearch)) {
        const response = await api.get(`/customers/phone/${customerSearch}`);
        setCustomer(response.data);
      } else {
        // Search by name
        const response = await api.get('/customers', { params: { search: customerSearch } });
        if (response.data.length > 0) {
          setCustomer(response.data[0]);
        } else {
          setCustomer(null);
          alert('Müştəri tapılmadı');
        }
      }
    } catch (error) {
      setCustomer(null);
      alert('Müştəri tapılmadı');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('az-AZ').format(Math.round(num));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-secondary text-white px-3 py-1.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h1 className="text-lg font-bold">POS</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="opacity-80">Kassir:</span> <span className="font-semibold">{user?.fullName}</span>
          </div>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-2 py-1 text-xs bg-white text-gray-900 rounded-md border-0"
          >
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Cart */}
        <div className="flex-1 flex flex-col p-2 overflow-hidden">
          {/* Barcode/Product Search */}
          <div className="mb-2 relative">
            <form onSubmit={handleBarcodeSubmit}>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                  setShowSearchResults(false);
                }}
                placeholder="🔍 Barkod və ya məhsul adı..."
                className="w-full px-3 py-2.5 text-base border-2 border-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-sm"
                autoFocus
              />
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && productSearchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-primary rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {productSearchResults.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleProductSelect(product)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category?.name || 'Kateqoriyasız'}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {product.variants?.[0]?.retailPrice || product.retailPrice || 0} ₼
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Search */}
          <div className="mb-2 bg-white rounded-lg shadow-sm p-1.5">
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <User className="w-4 h-4 text-gray-400 mt-2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomerSearch())}
                  placeholder="Ad və ya telefon"
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCustomerSearch}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
              >
                Axtar
              </button>
              {customer && (
                <button
                  type="button"
                  onClick={() => { setCustomer(null); setCustomerSearch(''); }}
                  className="px-2 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {customer && (
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <Check className="w-3 h-3 text-green-600" />
                <span className="font-semibold text-green-700">{customer.name}</span>
                {customer.balance > 0 && (
                  <span className="text-red-600 ml-2">Borc: {customer.balance.toFixed(2)} ₼</span>
                )}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-2 py-0.5 border-b">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-700 text-xs">Səbət ({cart.length})</h2>
                {cart.length > 0 && (
                  <button
                    onClick={() => confirm('Səbəti təmizləmək istədiyinizə əminsiniz?') && setCart([])}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Təmizlə
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Səbət boşdur</p>
                  <p className="text-xs mt-1">Barkod skan edin</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {cart.map((item, index) => (
                    <div key={`${item.productId}-${item.variantId}-${index}`} className="flex items-center gap-1 p-1 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-xs">{item.productName}</p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(item.unitPrice)} ₼ × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, -1, item.variantId)}
                          className="p-0.5 bg-gray-200 rounded hover:bg-gray-300">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1, item.variantId)}
                          className="p-0.5 bg-gray-200 rounded hover:bg-gray-300">
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="w-16 text-right font-bold text-xs">{formatNumber(item.total)} ₼</span>
                        <button
                          onClick={() => removeFromCart(item.productId, item.variantId)}
                          className="p-0.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Payment */}
        <div className="w-72 bg-white border-l flex flex-col">
          {/* Total Display */}
          <div className="bg-gradient-to-r from-primary to-yellow-500 text-white p-2">
            <p className="text-xs opacity-90">YEKUN</p>
            <p className="text-2xl font-bold leading-tight">{formatNumber(total)} ₼</p>
            <p className="text-xs opacity-80">{cart.length} məhsul</p>
          </div>

          {/* Payment Methods */}
          <div className="p-1.5 border-b">
            <label className="block text-xs font-medium text-gray-700 mb-1">Ödəniş üsulu</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`p-2 rounded-lg border-2 transition-all ${paymentMethod === 'CASH'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <Banknote className="w-5 h-5 mx-auto" />
                <p className="text-xs font-medium mt-0.5">Nağd</p>
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-lg border-2 transition-all ${paymentMethod === 'CARD'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <CreditCard className="w-5 h-5 mx-auto" />
                <p className="text-xs font-medium mt-0.5">Kart</p>
              </button>
              <button
                onClick={() => setPaymentMethod('CREDIT')}
                disabled={!customer}
                className={`p-3 rounded-lg border-2 transition-all ${paymentMethod === 'CREDIT'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300'
                  } ${!customer ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Calculator className="w-5 h-5 mx-auto" />
                <p className="text-xs font-medium mt-0.5">Borc</p>
              </button>
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === 'CASH' && (
            <div className="p-2 border-b">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nağd məbləğ</label>
              <input
                type="number"
                step="0.01"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {cashReceived > 0 && (
                <div className="mt-1.5 p-1.5 bg-green-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Qalıq:</span>
                    <span className="text-lg font-bold text-green-600">{formatNumber(change)} ₼</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card Input */}
          {paymentMethod === 'CARD' && (
            <div className="p-2 border-b">
              <label className="block text-xs font-medium text-gray-700 mb-1">Kart məbləği (istəyə bağlı)</label>
              <input
                type="number"
                step="0.01"
                value={cardAmount || ''}
                onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                placeholder={`${formatNumber(total)} ₼`}
                className="w-full px-3 py-1.5 text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-0.5">Boş buraxsanız tam məbləğ qəbul ediləcək</p>
            </div>
          )}

          {/* Credit Input */}
          {paymentMethod === 'CREDIT' && customer && (
            <div className="p-2 border-b">
              <label className="block text-xs font-medium text-gray-700 mb-1">İndi ödənilən məbləğ</label>
              <input
                type="number"
                step="0.01"
                value={creditPaidAmount || ''}
                onChange={(e) => setCreditPaidAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <div className="mt-1.5 p-1.5 bg-orange-50 rounded-lg">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Yekun:</span>
                  <span className="font-semibold">{formatNumber(total)} ₼</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Ödənilən:</span>
                  <span className="font-semibold text-green-600">{formatNumber(creditPaidAmount)} ₼</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-1">
                  <span className="text-gray-700 font-medium">Qalan borc:</span>
                  <span className="text-lg font-bold text-red-600">{formatNumber(total - creditPaidAmount)} ₼</span>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex-1 p-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Ara cəm:</span>
              <span className="font-semibold">{formatNumber(subtotal)} ₼</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-1.5">
              <span>YEKUN:</span>
              <span className="text-primary">{formatNumber(total)} ₼</span>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="p-2 border-t">
            <button
              onClick={() => setShowCheckoutModal(true)}
              disabled={cart.length === 0 || (paymentMethod === 'CASH' && cashReceived < total)}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-base font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              <Check className="w-5 h-5" />
              Ödənişi Tamamla (F9)
            </button>
            <p className="text-xs text-center text-gray-500 mt-1">ESC - Səbəti təmizlə</p>
          </div>
        </div>
      </div>

      {/* Checkout Confirmation Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-secondary mb-4">Ödənişi Təsdiqlə</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Məhsul sayı:</span>
                <span className="font-semibold">{cart.length}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Ödəniş üsulu:</span>
                <span className="font-semibold">
                  {paymentMethod === 'CASH' && '💵 Nağd'}
                  {paymentMethod === 'CARD' && '💳 Kart'}
                  {paymentMethod === 'CREDIT' && '📝 Borc'}
                </span>
              </div>
              {customer && (
                <div className="flex justify-between p-3 bg-blue-50 rounded">
                  <span className="text-gray-600">Müştəri:</span>
                  <span className="font-semibold text-blue-700">{customer.name}</span>
                </div>
              )}
              <div className="flex justify-between p-3 bg-primary bg-opacity-10 rounded">
                <span className="text-gray-700 font-medium">YEKUN:</span>
                <span className="text-2xl font-bold text-primary">{formatNumber(total)} ₼</span>
              </div>
              {paymentMethod === 'CASH' && change > 0 && (
                <div className="flex justify-between p-3 bg-green-50 rounded">
                  <span className="text-gray-600">Qalıq:</span>
                  <span className="text-xl font-bold text-green-600">{formatNumber(change)} ₼</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckoutModal(false)}
                disabled={processing}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 disabled:opacity-50"
              >
                Ləğv et
              </button>
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Gözləyin...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Təsdiqlə
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
