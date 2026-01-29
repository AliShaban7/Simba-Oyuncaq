import { useEffect, useState, useRef } from 'react';
import api from '../api/api';
import {
  Package,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  X,
  MapPin,
  Boxes,
  ClipboardList,
  ArrowRightLeft,
  Settings,
  Plus,
  Minus,
  Check,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

type StockMode = 'dashboard' | 'receipt' | 'stocktake' | 'transfer' | 'adjustment';

interface LineItem {
  variantId: string;
  variantName: string;
  barcode?: string;
  quantity: number;
  costPrice?: number;
}

export default function Stock() {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<StockMode>('dashboard');
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [showMovements, setShowMovements] = useState(false);

  // Receipt mode
  const [receiptLocation, setReceiptLocation] = useState('');
  const [receiptSupplier, setReceiptSupplier] = useState('');
  const [receiptDocNo, setReceiptDocNo] = useState('');
  const [receiptItems, setReceiptItems] = useState<LineItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Stocktake mode
  const [stocktakeLocation, setStocktakeLocation] = useState('');
  const [stocktakeItems, setStocktakeItems] = useState<LineItem[]>([]);
  const [stocktakeReason, setStocktakeReason] = useState('');
  const [stocktakeInProgress, setStocktakeInProgress] = useState(false);

  // Transfer mode
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferItems, setTransferItems] = useState<LineItem[]>([]);

  // Adjustment mode
  const [adjustmentLocation, setAdjustmentLocation] = useState('');
  const [adjustmentItems, setAdjustmentItems] = useState<LineItem[]>([]);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchLocations();
    fetchInventory();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchInventory();
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
      if (response.data.length > 0 && !selectedLocation) {
        const firstLoc = response.data[0]._id;
        setSelectedLocation(firstLoc);
        setReceiptLocation(firstLoc);
        setStocktakeLocation(firstLoc);
        setAdjustmentLocation(firstLoc);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = selectedLocation ? { locationId: selectedLocation } : {};
      const response = await api.get('/stock/balances', { params });
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (productId: string) => {
    try {
      const response = await api.get('/stock/movements', {
        params: { variantId: productId, limit: 20 }
      });
      setMovements(response.data);
      setShowMovements(true);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Barcode scanning handler
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const barcode = barcodeInput.trim();
    setBarcodeInput('');

    try {
      const response = await api.get(`/barcodes/lookup/${barcode}`);
      const { variant } = response.data;
      const product = variant.productId || variant;

      const lineItem: LineItem = {
        variantId: variant._id,
        variantName: product.name,
        barcode: barcode,
        quantity: 1,
        costPrice: variant.costPrice || 0
      };

      if (mode === 'receipt') {
        addReceiptItem(lineItem);
      } else if (mode === 'stocktake') {
        addStocktakeItem(lineItem);
      } else if (mode === 'transfer') {
        addTransferItem(lineItem);
      } else if (mode === 'adjustment') {
        addAdjustmentItem(lineItem);
      }

      barcodeInputRef.current?.focus();
    } catch (error: any) {
      if (error.response?.status === 404) {
        showNotification(`Barkod tapılmadı: ${barcode}`, 'error');
      } else {
        showNotification('Xəta baş verdi', 'error');
      }
      barcodeInputRef.current?.focus();
    }
  };

  // Receipt mode functions
  const addReceiptItem = (item: LineItem) => {
    const existing = receiptItems.find(i => i.variantId === item.variantId);
    if (existing) {
      setReceiptItems(receiptItems.map(i =>
        i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setReceiptItems([...receiptItems, item]);
    }
  };

  const confirmReceipt = async () => {
    if (!receiptLocation || receiptItems.length === 0) {
      showNotification('Lokasiya və məhsul seçin', 'error');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/stock/receipts', {
        locationId: receiptLocation,
        supplier: receiptSupplier,
        documentNo: receiptDocNo,
        items: receiptItems,
        createdBy: user?.id
      });

      showNotification('Qəbul uğurla tamamlandı', 'success');
      setReceiptItems([]);
      setReceiptSupplier('');
      setReceiptDocNo('');
      fetchInventory();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Xəta baş verdi', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Stocktake mode functions
  const addStocktakeItem = (item: LineItem) => {
    const existing = stocktakeItems.find(i => i.variantId === item.variantId);
    if (existing) {
      setStocktakeItems(stocktakeItems.map(i =>
        i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setStocktakeItems([...stocktakeItems, item]);
    }
  };

  const startStocktake = () => {
    if (!stocktakeLocation) {
      showNotification('Lokasiya seçin', 'error');
      return;
    }
    setStocktakeInProgress(true);
    setStocktakeItems([]);
  };

  const finalizeStocktake = async () => {
    if (!stocktakeReason.trim()) {
      showNotification('Səbəb daxil edin', 'error');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/stock/stocktakes/finalize', {
        locationId: stocktakeLocation,
        items: stocktakeItems,
        reason: stocktakeReason,
        createdBy: user?.id
      });

      showNotification('Sayım uğurla tamamlandı', 'success');
      setStocktakeItems([]);
      setStocktakeReason('');
      setStocktakeInProgress(false);
      fetchInventory();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Xəta baş verdi', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Transfer mode functions
  const addTransferItem = (item: LineItem) => {
    const existing = transferItems.find(i => i.variantId === item.variantId);
    if (existing) {
      setTransferItems(transferItems.map(i =>
        i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setTransferItems([...transferItems, item]);
    }
  };

  const confirmTransfer = async () => {
    if (!transferFrom || !transferTo || transferItems.length === 0) {
      showNotification('Lokasiyalar və məhsul seçin', 'error');
      return;
    }

    if (transferFrom === transferTo) {
      showNotification('Eyni lokasiyaya transfer edilə bilməz', 'error');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/stock/transfers', {
        fromLocationId: transferFrom,
        toLocationId: transferTo,
        items: transferItems,
        createdBy: user?.id
      });

      showNotification('Transfer uğurla tamamlandı', 'success');
      setTransferItems([]);
      fetchInventory();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Xəta baş verdi', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Adjustment mode functions
  const addAdjustmentItem = (item: LineItem) => {
    setAdjustmentItems([...adjustmentItems, { ...item, quantity: 0 }]);
  };

  const confirmAdjustment = async () => {
    if (!adjustmentLocation || adjustmentItems.length === 0 || !adjustmentReason.trim()) {
      showNotification('Lokasiya, məhsul və səbəb daxil edin', 'error');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/stock/adjustments', {
        locationId: adjustmentLocation,
        items: adjustmentItems,
        reason: adjustmentReason,
        createdBy: user?.id
      });

      showNotification('Düzəliş uğurla edildi', 'success');
      setAdjustmentItems([]);
      setAdjustmentReason('');
      fetchInventory();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Xəta baş verdi', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const filteredInventory = inventory.filter((item: any) =>
    item.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productId?.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productId?.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalProducts: new Set(inventory.map((item: any) => item.productId?._id)).size,
    totalQuantity: inventory.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
    lowStock: inventory.filter((item: any) => item.quantity > 0 && item.quantity <= 10).length
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-secondary flex items-center gap-2">
              <Boxes className="w-7 h-7" />
              Stok İdarəsi
            </h1>
            <p className="text-sm text-gray-600 mt-1">Anbar əməliyyatları</p>
          </div>

          {/* Mode Selection + Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMode('dashboard')}
              className={`px-3 py-2 rounded-lg border transition-all text-sm font-medium flex items-center gap-1 ${mode === 'dashboard'
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
            >
              <Package className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setMode('receipt')}
              className={`px-3 py-2 rounded-lg border transition-all text-sm font-medium flex items-center gap-1 ${mode === 'receipt'
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
            >
              <Plus className="w-4 h-4" />
              Qəbul
            </button>
            <button
              onClick={() => setMode('stocktake')}
              className={`px-3 py-2 rounded-lg border transition-all text-sm font-medium flex items-center gap-1 ${mode === 'stocktake'
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
            >
              <ClipboardList className="w-4 h-4" />
              Sayım
            </button>
            <button
              onClick={() => setMode('transfer')}
              className={`px-3 py-2 rounded-lg border transition-all text-sm font-medium flex items-center gap-1 ${mode === 'transfer'
                ? 'border-purple-500 bg-purple-500 text-white'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfer
            </button>
            <button
              onClick={() => setMode('adjustment')}
              disabled={!isAdmin}
              className={`px-3 py-2 rounded-lg border transition-all text-sm font-medium flex items-center gap-1 ${mode === 'adjustment'
                ? 'border-orange-500 bg-orange-500 text-white'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Settings className="w-4 h-4" />
              Düzəliş
            </button>

            {mode === 'dashboard' && (
              <button
                onClick={fetchInventory}
                className="bg-primary text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 text-sm font-medium ml-2"
              >
                <RefreshCw className="w-4 h-4" />
                Yenilə
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {mode === 'dashboard' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Məhsul Sayı</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-medium">Ümumi Miqdar</p>
                    <p className="text-2xl font-bold text-green-700">{stats.totalQuantity}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-yellow-600 font-medium">Az Ehtiyat</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.lowStock}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Məhsul adı, barkod və ya marka ilə axtar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">Bütün Lokasiyalar</option>
                    {locations.map((loc: any) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Yüklənir...</p>
                </div>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Məhsul tapılmadı</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredInventory.map((item: any) => {
                  const status = item.quantity === 0 ? { label: 'Bitib', color: 'bg-red-100 text-red-800' } :
                    item.quantity <= 10 ? { label: 'Az', color: 'bg-yellow-100 text-yellow-800' } :
                      { label: 'Normal', color: 'bg-green-100 text-green-800' };

                  return (
                    <div
                      key={item._id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-yellow-500 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base truncate">
                                {item.productId?.name || 'Unknown'}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {item.productId?.brand && (
                                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                    {item.productId.brand}
                                  </span>
                                )}
                                {item.productId?.category && (
                                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                    {item.productId.category.name}
                                  </span>
                                )}
                                {item.productId?.barcode && (
                                  <span className="text-xs text-gray-500 font-mono">
                                    {item.productId.barcode}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-700">{item.locationId?.name || 'Unknown'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Miqdar</p>
                            <p className="text-3xl font-bold text-gray-900">{item.quantity}</p>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </div>
                          <button
                            onClick={() => fetchMovements(item.productId?._id)}
                            className="text-xs text-primary hover:text-opacity-80 flex items-center gap-1 mt-1"
                          >
                            <Eye className="w-3 h-3" />
                            Hərəkətlər
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


        {/* Receipt Mode */}
        {mode === 'receipt' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Mal Qəbulu
            </h2>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasiya *
                </label>
                <select
                  value={receiptLocation}
                  onChange={(e) => setReceiptLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {locations.map((loc: any) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Təchizatçı
                </label>
                <input
                  type="text"
                  value={receiptSupplier}
                  onChange={(e) => setReceiptSupplier(e.target.value)}
                  placeholder="Təchizatçı adı"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sənəd №
                </label>
                <input
                  type="text"
                  value={receiptDocNo}
                  onChange={(e) => setReceiptDocNo(e.target.value)}
                  placeholder="Qəbul sənədi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Barcode Scanner */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barkod Skan Et
              </label>
              <form onSubmit={handleBarcodeSubmit}>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Barkodu skan edin və ya daxil edin..."
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                  autoFocus
                />
              </form>
            </div>

            {/* Line Items */}
            {receiptItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Məhsullar ({receiptItems.length})</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Məhsul</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barkod</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miqdar</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maya dəyəri</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Əməliyyat</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {receiptItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.variantName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{item.barcode || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 1;
                                setReceiptItems(receiptItems.map((i, idx) =>
                                  idx === index ? { ...i, quantity: newQty } : i
                                ));
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.costPrice || 0}
                              onChange={(e) => {
                                const newCost = parseFloat(e.target.value) || 0;
                                setReceiptItems(receiptItems.map((i, idx) =>
                                  idx === index ? { ...i, costPrice: newCost } : i
                                ));
                              }}
                              className="w-24 px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <button
                              onClick={() => setReceiptItems(receiptItems.filter((_, idx) => idx !== index))}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Ümumi: <span className="font-bold text-lg">{receiptItems.reduce((sum, item) => sum + item.quantity, 0)}</span> ədəd
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setReceiptItems([]);
                    setReceiptSupplier('');
                    setReceiptDocNo('');
                    setBarcodeInput('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Təmizlə
                </button>
                <button
                  onClick={confirmReceipt}
                  disabled={receiptItems.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Qəbul Et
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Stocktake Mode */}
        {mode === 'stocktake' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Ehtiyat Sayımı
            </h2>

            {!stocktakeInProgress ? (
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasiya *
                  </label>
                  <select
                    value={stocktakeLocation}
                    onChange={(e) => setStocktakeLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {locations.map((loc: any) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={startStocktake}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <ClipboardList className="w-5 h-5" />
                  Sayımı Başlat
                </button>
              </div>
            ) : (
              <div>
                {/* Barcode Scanner */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barkod Skan Et
                  </label>
                  <form onSubmit={handleBarcodeSubmit}>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Barkodu skan edin və ya daxil edin..."
                      className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      autoFocus
                    />
                  </form>
                </div>

                {/* Counted Items */}
                {stocktakeItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Sayılmış Məhsullar ({stocktakeItems.length})</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Məhsul</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sayılmış</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Əməliyyat</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stocktakeItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.variantName}</td>
                              <td className="px-4 py-3 text-sm">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 0;
                                    setStocktakeItems(stocktakeItems.map((i, idx) =>
                                      idx === index ? { ...i, quantity: newQty } : i
                                    ));
                                  }}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                <button
                                  onClick={() => setStocktakeItems(stocktakeItems.filter((_, idx) => idx !== index))}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Səbəb *
                  </label>
                  <textarea
                    value={stocktakeReason}
                    onChange={(e) => setStocktakeReason(e.target.value)}
                    placeholder="Sayım səbəbini qeyd edin..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStocktakeInProgress(false);
                      setStocktakeItems([]);
                      setStocktakeReason('');
                      setBarcodeInput('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Ləğv Et
                  </button>
                  <button
                    onClick={finalizeStocktake}
                    disabled={stocktakeItems.length === 0 || !stocktakeReason.trim()}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Tamamla
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transfer Mode */}
        {mode === 'transfer' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6" />
              Stok Transferi
            </h2>

            {/* From/To Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Haradan *
                </label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seçin</option>
                  {locations.map((loc: any) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hara *
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seçin</option>
                  {locations.map((loc: any) => (
                    <option key={loc._id} value={loc._id} disabled={loc._id === transferFrom}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barcode Scanner */}
            {transferFrom && transferTo && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barkod Skan Et
                </label>
                <form onSubmit={handleBarcodeSubmit}>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Barkodu skan edin və ya daxil edin..."
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                    autoFocus
                  />
                </form>
              </div>
            )}

            {/* Transfer Items */}
            {transferItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Transfer Ediləcək Məhsullar ({transferItems.length})</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Məhsul</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miqdar</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Əməliyyat</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transferItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.variantName}</td>
                          <td className="px-4 py-3 text-sm">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 1;
                                setTransferItems(transferItems.map((i, idx) =>
                                  idx === index ? { ...i, quantity: newQty } : i
                                ));
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <button
                              onClick={() => setTransferItems(transferItems.filter((_, idx) => idx !== index))}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Ümumi: <span className="font-bold text-lg">{transferItems.reduce((sum, item) => sum + item.quantity, 0)}</span> ədəd
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTransferItems([]);
                    setBarcodeInput('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Təmizlə
                </button>
                <button
                  onClick={confirmTransfer}
                  disabled={!transferFrom || !transferTo || transferItems.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  Transfer Et
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Adjustment Mode */}
        {mode === 'adjustment' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-orange-700 mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Stok Düzəlişi
            </h2>

            {!isAdmin && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Bu əməliyyat yalnız Admin və ya Manager istifadəçiləri üçün əlçatandır.
                </p>
              </div>
            )}

            {isAdmin && (
              <div>
                {/* Location */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasiya *
                  </label>
                  <select
                    value={adjustmentLocation}
                    onChange={(e) => setAdjustmentLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {locations.map((loc: any) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barcode Scanner */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barkod Skan Et
                  </label>
                  <form onSubmit={handleBarcodeSubmit}>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Barkodu skan edin və ya daxil edin..."
                      className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                      autoFocus
                    />
                  </form>
                </div>

                {/* Adjustment Items */}
                {adjustmentItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Düzəliş Ediləcək Məhsullar ({adjustmentItems.length})</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Məhsul</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Düzəliş</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Əməliyyat</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {adjustmentItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.variantName}</td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setAdjustmentItems(adjustmentItems.map((i, idx) =>
                                        idx === index ? { ...i, quantity: i.quantity - 1 } : i
                                      ));
                                    }}
                                    className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQty = parseInt(e.target.value) || 0;
                                      setAdjustmentItems(adjustmentItems.map((i, idx) =>
                                        idx === index ? { ...i, quantity: newQty } : i
                                      ));
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                                  />
                                  <button
                                    onClick={() => {
                                      setAdjustmentItems(adjustmentItems.map((i, idx) =>
                                        idx === index ? { ...i, quantity: i.quantity + 1 } : i
                                      ));
                                    }}
                                    className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                <button
                                  onClick={() => setAdjustmentItems(adjustmentItems.filter((_, idx) => idx !== index))}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Səbəb *
                  </label>
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Düzəliş səbəbini qeyd edin..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Məhsullar: <span className="font-bold text-lg">{adjustmentItems.length}</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setAdjustmentItems([]);
                        setAdjustmentReason('');
                        setBarcodeInput('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Təmizlə
                    </button>
                    <button
                      onClick={confirmAdjustment}
                      disabled={adjustmentItems.length === 0 || !adjustmentReason.trim()}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Düzəliş Et
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Movements Modal */}
      {showMovements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Ehtiyat Hərəkətləri</h2>
              <button
                onClick={() => setShowMovements(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {movements.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Hərəkət tapılmadı</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement: any) => (
                    <div
                      key={movement._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${movement.type?.includes('IN') ? 'bg-green-100 text-green-800' :
                              movement.type?.includes('OUT') ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                              {movement.type}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(movement.createdAt).toLocaleDateString('az-AZ', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{movement.locationId?.name || 'Unknown'}</span>
                          </p>
                          {movement.createdBy && (
                            <p className="text-xs text-gray-500 mt-1">
                              İstifadəçi: {movement.createdBy.fullName}
                            </p>
                          )}
                          {movement.notes && (
                            <p className="text-xs text-gray-500 mt-1">{movement.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${movement.type?.includes('IN') ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {movement.type?.includes('IN') ? '+' : '-'}
                            {movement.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 bg-gray-50">
              <button
                onClick={() => setShowMovements(false)}
                className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
