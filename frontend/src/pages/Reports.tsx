import { useEffect, useState } from 'react';
import api from '../api/api';
import { BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';

export default function Reports() {
  const [salesReport, setSalesReport] = useState<any[]>([]);
  const [topDebtors, setTopDebtors] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    fetchLocations();
    fetchReports();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo, selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const [sales, debtors, low] = await Promise.all([
        api.get('/reports/sales', {
          params: {
            locationId: selectedLocation || undefined,
            dateFrom,
            dateTo,
          },
        }),
        api.get('/reports/top-debtors', { params: { limit: 10 } }),
        api.get('/reports/low-stock', { params: { threshold: 10 } }),
      ]);

      setSalesReport(sales.data);
      setTopDebtors(debtors.data);
      setLowStock(low.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const totalSales = salesReport.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalItems = salesReport.reduce((sum, sale) => sum + (sale.items?.length || 0), 0);

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-secondary mb-6">Hesabatlar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ümumi Satış</p>
              <p className="text-2xl font-bold text-secondary mt-2">{totalSales.toFixed(2)} AZN</p>
            </div>
            <div className="bg-primary p-4 rounded-full text-white">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Satış Sayı</p>
              <p className="text-2xl font-bold text-secondary mt-2">{salesReport.length}</p>
            </div>
            <div className="bg-green-500 p-4 rounded-full text-white">
              <BarChart3 className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Az Ehtiyat</p>
              <p className="text-2xl font-bold text-secondary mt-2">{lowStock.length}</p>
            </div>
            <div className="bg-yellow-500 p-4 rounded-full text-white">
              <Package className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-secondary mb-4">Filtr</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Başlanğıc tarix</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Son tarix</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lokasiya</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Hamısı</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary mb-4">Ən çox borcu olan müştərilər</h2>
          <div className="space-y-3">
            {topDebtors.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Məlumat yoxdur</p>
            ) : (
              topDebtors.map((debtor, index) => (
                <div key={debtor._id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{debtor.name}</p>
                    <p className="text-sm text-gray-600">{debtor.phone || '-'}</p>
                  </div>
                  <p className="text-red-600 font-semibold">{debtor.balance?.toFixed(2) || '0.00'} AZN</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-secondary mb-4">Az Ehtiyat Məhsullar</h2>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Az ehtiyat məhsul yoxdur</p>
            ) : (
              lowStock.slice(0, 10).map((item, index) => (
                <div key={item._id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.productId?.name || 'Naməlum'}</p>
                    <p className="text-sm text-gray-600">{item.locationId?.name || '-'}</p>
                  </div>
                  <p className="text-yellow-600 font-semibold">{item.quantity || 0} ədəd</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold text-secondary mb-4">Son Satışlar</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-secondary text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Satış №</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Tarix</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Məbləğ</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Ödəniş</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesReport.slice(0, 20).map((sale) => (
                <tr key={sale._id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">{sale.saleNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(sale.createdAt).toLocaleDateString('az-AZ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{sale.total?.toFixed(2)} AZN</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {sale.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


