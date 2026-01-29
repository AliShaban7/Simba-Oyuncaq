import { useEffect, useState } from 'react';
import api from '../api/api';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, AlertTriangle, ShoppingCart, Star } from 'lucide-react';

type TimeFilter = 'today' | 'week' | 'month' | 'custom';

export default function Reports() {
  const [salesReport, setSalesReport] = useState<any[]>([]);
  const [topDebtors, setTopDebtors] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
    applyTimeFilter('today');
  }, []);

  useEffect(() => {
    if (timeFilter === 'custom') {
      fetchReports();
    }
  }, [dateFrom, dateTo, selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const applyTimeFilter = (filter: TimeFilter) => {
    setTimeFilter(filter);
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch (filter) {
      case 'today':
        from = today;
        to = today;
        break;
      case 'week':
        from = new Date(today.setDate(today.getDate() - 7));
        to = new Date();
        break;
      case 'month':
        from = new Date(today.setMonth(today.getMonth() - 1));
        to = new Date();
        break;
      case 'custom':
        return; // Don't auto-fetch for custom
    }

    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);

    // Fetch with new dates
    fetchReportsWithDates(from.toISOString().split('T')[0], to.toISOString().split('T')[0]);
  };

  const fetchReportsWithDates = async (from: string, to: string) => {
    try {
      setLoading(true);
      const [sales, debtors] = await Promise.all([
        api.get('/reports/sales', {
          params: {
            locationId: selectedLocation || undefined,
            dateFrom: from,
            dateTo: to,
          },
        }),
        api.get('/reports/top-debtors', { params: { limit: 5 } }),
      ]);

      setSalesReport(sales.data);
      setTopDebtors(debtors.data);

      // Calculate top selling products from sales data
      const productStats = new Map<string, { name: string; quantity: number; revenue: number }>();
      sales.data.forEach((sale: any) => {
        sale.items?.forEach((item: any) => {
          const productId = item.productId?._id || item.productId;
          const productName = item.productId?.name || item.productName || 'Unknown';
          const existing = productStats.get(productId) || { name: productName, quantity: 0, revenue: 0 };
          existing.quantity += item.quantity || 0;
          existing.revenue += (item.price || 0) * (item.quantity || 0);
          productStats.set(productId, existing);
        });
      });

      const topProductsArray = Array.from(productStats.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);
      setTopProducts(topProductsArray);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = () => fetchReportsWithDates(dateFrom, dateTo);

  const totalSales = salesReport.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalCost = salesReport.reduce((sum, sale) => {
    const items = sale.items || [];
    return sum + items.reduce((itemSum: number, item: any) =>
      itemSum + ((item.costPrice || 0) * (item.quantity || 0)), 0);
  }, 0);
  const profit = totalSales - totalCost;
  const totalDebt = topDebtors.reduce((sum, d) => sum + (d.balance || 0), 0);

  // Format large numbers with thousand separators
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('az-AZ').format(Math.round(num));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header with Time Filters */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Hesabatlar
          </h1>

          {/* Quick Time Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['today', 'week', 'month', 'custom'] as TimeFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => applyTimeFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeFilter === filter
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {filter === 'today' && 'Bu gün'}
                  {filter === 'week' && '7 gün'}
                  {filter === 'month' && '30 gün'}
                  {filter === 'custom' && 'Xüsusi'}
                </button>
              ))}
            </div>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                fetchReports();
              }}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Bütün lokasiyalar</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {timeFilter === 'custom' && (
          <div className="flex gap-2 mt-3 items-center">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
            <span className="text-gray-500 text-sm">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
            <button
              onClick={fetchReports}
              className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-opacity-90"
            >
              Tətbiq et
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-gray-600">Yüklənir...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* KPI Cards - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Total Sales */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">Satış</span>
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-xl lg:text-2xl font-bold truncate">{formatNumber(totalSales)}</p>
                    <p className="text-xs opacity-80">AZN</p>
                  </div>
                </div>
              </div>

              {/* Profit */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Mənfəət</span>
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-xl lg:text-2xl font-bold truncate">{formatNumber(profit)}</p>
                    <p className="text-xs opacity-80">AZN</p>
                  </div>
                </div>
              </div>

              {/* Sales Count */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="text-sm font-medium">Sifariş</span>
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-xl lg:text-2xl font-bold truncate">{formatNumber(salesReport.length)}</p>
                    <p className="text-xs opacity-80">ədəd</p>
                  </div>
                </div>
              </div>

              {/* Total Debt */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-4 text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">Debitor</span>
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-xl lg:text-2xl font-bold truncate">{formatNumber(totalDebt)}</p>
                    <p className="text-xs opacity-80">AZN</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Recent Sales - Takes 2 columns */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-secondary text-white px-4 py-3 flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Son Satışlar
                  </h2>
                  <span className="text-xs opacity-80">{salesReport.length} satış</span>
                </div>
                <div className="overflow-y-auto max-h-80">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">№</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tarix</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Məbləğ</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ödəniş</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesReport.slice(0, 15).map((sale) => (
                        <tr key={sale._id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs font-mono text-gray-900">{sale.saleNo}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {new Date(sale.createdAt).toLocaleDateString('az-AZ', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-right text-gray-900">
                            {sale.total?.toFixed(2)} ₼
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${sale.paymentMethod === 'CASH'
                              ? 'bg-green-100 text-green-800'
                              : sale.paymentMethod === 'CARD'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                              }`}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {salesReport.length === 0 && (
                    <p className="text-center text-gray-500 py-8 text-sm">Məlumat yoxdur</p>
                  )}
                </div>
              </div>

              {/* Right Column - Debtors & Low Stock */}
              <div className="space-y-4">
                {/* Top Debtors */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Debitorlar
                    </h2>
                  </div>
                  <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                    {topDebtors.length === 0 ? (
                      <p className="text-gray-500 text-center py-4 text-xs">Debitor borc yoxdur</p>
                    ) : (
                      topDebtors.map((debtor, index) => (
                        <div key={debtor._id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{debtor.name}</p>
                            <p className="text-gray-500 text-xs truncate">{debtor.phone || '-'}</p>
                          </div>
                          <p className="text-red-600 font-bold ml-2">{debtor.balance?.toFixed(0)} ₼</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 flex items-center justify-between">
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Ən Çox Satılan
                    </h2>
                    <span className="text-xs opacity-80">{topProducts.length}</span>
                  </div>
                  <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                    {topProducts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4 text-xs">Məlumat yoxdur</p>
                    ) : (
                      topProducts.map((product, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-gray-500 text-xs">{formatNumber(product.revenue)} ₼</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                              {product.quantity}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
