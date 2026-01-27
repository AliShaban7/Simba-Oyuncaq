import { useEffect, useState } from 'react';
import api from '../api/api';
import { Package, ArrowRightLeft, Plus, QrCode, Search } from 'lucide-react';

interface StockBalance {
  _id: string;
  productId: {
    _id: string;
    name: string;
    barcode?: string;
  };
  locationId: {
    _id: string;
    name: string;
  };
  quantity: number;
}

export default function Stock() {
  const [stock, setStock] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<StockBalance[]>([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanBarcode, setScanBarcode] = useState('');

  useEffect(() => {
    fetchLocations();
    fetchLowStock();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchStock();
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
      if (response.data.length > 0 && !selectedLocation) {
        setSelectedLocation(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchStock = async () => {
    if (!selectedLocation) return;
    setLoading(true);
    try {
      const response = await api.get(`/stock-movements/by-location/${selectedLocation}`);
      setStock(response.data);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await api.get('/stock-movements/low-stock', { params: { threshold: 10 } });
      setLowStock(response.data);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary">Ehtiyat</h1>
        <button
          onClick={() => setShowScanModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
        >
          <QrCode className="w-5 h-5" />
          Skan Et
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Lokasiya seçin</label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md"
        >
          {locations.map((loc) => (
            <option key={loc._id} value={loc._id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Az Ehtiyat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStock.slice(0, 6).map((item) => (
              <div key={item._id} className="bg-white rounded p-3">
                <p className="font-medium">{item.productId.name}</p>
                <p className="text-sm text-gray-600">
                  {item.locationId.name}: {item.quantity} ədəd
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Yüklənir...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-secondary text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Məhsul</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Barkod</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Miqdar</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stock.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.productId.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {item.productId.barcode || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.quantity <= 10 ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Az
                      </span>
                    ) : item.quantity === 0 ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Bitib
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-secondary mb-4">Barkodla Axtar</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Barkod</label>
                <input
                  type="text"
                  value={scanBarcode}
                  onChange={(e) => setScanBarcode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Barkodu daxil edin"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (scanBarcode.trim()) {
                      // Search for product in stock
                      const stockItem = stock.find(item => item.productId.barcode === scanBarcode.trim());
                      if (stockItem) {
                        // Highlight the found item
                        alert(`${stockItem.productId.name} - Miqdar: ${stockItem.quantity}`);
                      } else {
                        alert('Bu məhsul anbarda tapılmadı');
                      }
                    }
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Axtar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScanModal(false);
                    setScanBarcode('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Bağla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



