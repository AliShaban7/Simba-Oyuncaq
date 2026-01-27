import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  CreditCard,
  BarChart3,
  Warehouse,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCustomers: 0,
    todayRevenue: 0,
    todaySalesCount: 0,
    totalDebtors: 0,
    lowStockItems: 0,
    totalLocations: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const [products, sales, customers, locations, daySales, debtors] = await Promise.all([
          api.get('/products').catch(() => ({ data: [] })),
          api.get('/sales?limit=100').catch(() => ({ data: [] })),
          api.get('/customers').catch(() => ({ data: [] })),
          api.get('/locations').catch(() => ({ data: [] })),
          api.get('/sales', {
            params: {
              dateFrom: today,
              dateTo: today,
            },
          }).catch(() => ({ data: [] })),
          api.get('/customers', {
            params: { withDebt: true }
          }).catch(() => ({ data: [] })),
        ]);

        const todaySalesData = daySales.data || [];
        const todayTotal = todaySalesData.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);

        // Calculate low stock items (you can adjust this logic based on your stock system)
        const stockData = await api.get('/stock-movements/balances').catch(() => ({ data: [] }));
        const lowStock = (stockData.data || []).filter((item: any) => item.quantity < 10).length;

        setStats({
          totalProducts: products.data.length,
          totalSales: sales.data.length,
          totalCustomers: customers.data.length,
          todayRevenue: todayTotal,
          todaySalesCount: todaySalesData.length,
          totalDebtors: debtors.data.filter((c: any) => (c.balance || 0) > 0).length,
          lowStockItems: lowStock,
          totalLocations: locations.data.length,
        });

        // Get recent sales
        const recent = (sales.data || []).slice(0, 5);
        setRecentSales(recent);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Bu Günün Gəliri',
      value: `${stats.todayRevenue.toFixed(2)} AZN`,
      subtitle: `${stats.todaySalesCount} satış`,
      icon: DollarSign,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      textColor: 'text-white',
      action: () => navigate('/sales'),
    },
    {
      title: 'Ümumi Məhsullar',
      value: stats.totalProducts.toLocaleString(),
      subtitle: `${stats.lowStockItems} azalıb`,
      icon: Package,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      textColor: 'text-white',
      action: () => navigate('/products'),
      alert: stats.lowStockItems > 0,
    },
    {
      title: 'Aktif Müştərilər',
      value: stats.totalCustomers.toLocaleString(),
      subtitle: `${stats.totalDebtors} borclu`,
      icon: Users,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      textColor: 'text-white',
      action: () => navigate('/customers'),
      alert: stats.totalDebtors > 0,
    },
    {
      title: 'Lokasiyalar',
      value: stats.totalLocations,
      subtitle: 'Anbar və mağaza',
      icon: Warehouse,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      textColor: 'text-white',
      action: () => navigate('/locations'),
    },
  ];

  const quickActions = [
    { title: 'Yeni Satış', icon: Plus, color: 'bg-primary', path: '/pos' },
    { title: 'Məhsul Əlavə Et', icon: Package, color: 'bg-blue-500', path: '/products' },
    { title: 'Müştəri Əlavə Et', icon: Users, color: 'bg-purple-500', path: '/customers' },
    { title: 'Hesabatlar', icon: BarChart3, color: 'bg-green-500', path: '/reports' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="px-4 py-4 bg-gray-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">İdarəetmə Paneli</h1>
            <p className="text-sm text-gray-600">
              Xoş gəlmisiniz, <span className="font-semibold text-primary">{user?.fullName || user?.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{new Date().toLocaleDateString('az-AZ', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  onClick={stat.action}
                  className={`${stat.color} ${stat.textColor} rounded-lg shadow-md p-4 cursor-pointer transform hover:scale-105 transition-all duration-200`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs opacity-90 font-medium mb-1 truncate">{stat.title}</p>
                      <p className="text-2xl font-bold mb-1">{stat.value}</p>
                      <p className="text-xs opacity-75 truncate">{stat.subtitle}</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm flex-shrink-0 ml-2">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] overflow-hidden">
            {/* Left Column - Quick Actions & Recent Sales */}
            <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-4 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Sürətli Əməliyyatlar
                </h2>
                <div className="grid grid-cols-4 gap-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => navigate(action.path)}
                        className={`${action.color} text-white rounded-lg p-3 flex flex-col items-center gap-1.5 hover:scale-105 transition-transform duration-200 shadow-sm hover:shadow-md`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium text-center leading-tight">{action.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Sales */}
              <div className="bg-white rounded-lg shadow-md p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    Son Satışlar
                  </h2>
                  <button
                    onClick={() => navigate('/sales')}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Hamısı <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {recentSales.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 flex-1 flex items-center justify-center">
                    <div>
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Hələ satış yoxdur</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {recentSales.map((sale: any) => (
                      <div
                        key={sale._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/sales/${sale._id}`)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                            sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">#{sale.saleNo || sale._id.slice(-6)}</p>
                            <p className="text-xs text-gray-500 truncate">{formatDate(sale.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="font-bold text-gray-900 text-sm">{sale.total?.toFixed(2) || '0.00'} AZN</p>
                          <p className="text-xs text-gray-500 capitalize">{sale.paymentMethod || 'cash'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Today's Summary */}
            <div className="flex flex-col h-full">
              <div className="bg-gradient-to-br from-primary to-accent rounded-lg shadow-md p-4 text-white flex-1 flex flex-col">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Bu Günün Xülasəsi
                </h2>
                <div className="space-y-2 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-2.5 rounded-lg">
                    <span className="text-xs opacity-90">Satış sayı</span>
                    <span className="font-bold text-base">{stats.todaySalesCount}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-2.5 rounded-lg">
                    <span className="text-xs opacity-90">Ümumi gəlir</span>
                    <span className="font-bold text-base">{stats.todayRevenue.toFixed(2)} AZN</span>
                  </div>
                  {stats.todaySalesCount > 0 && (
                    <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-2.5 rounded-lg">
                      <span className="text-xs opacity-90">Orta satış</span>
                      <span className="font-bold text-base">{(stats.todayRevenue / stats.todaySalesCount).toFixed(2)} AZN</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

