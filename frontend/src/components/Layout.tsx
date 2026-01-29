import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Warehouse,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  UserCog,
  LogOut,
  QrCode,
  Settings,
  ChevronDown,
} from 'lucide-react';

const mainMenuItems = [
  { path: '/', label: 'Əsas', icon: LayoutDashboard },
  { path: '/stock', label: 'Stok', icon: Warehouse },
  { path: '/pos', label: 'POS', icon: ShoppingCart },
  { path: '/barcode-generator', label: 'Barkod', icon: QrCode },
  { path: '/reports', label: 'Hesabatlar', icon: BarChart3 },
];

const managementItems = [
  { path: '/locations', label: 'Lokasiyalar', icon: MapPin },
  { path: '/customers', label: 'Müştərilər', icon: Users },
  { path: '/suppliers', label: 'Təchizatçılar', icon: Truck },
  { path: '/users', label: 'İstifadəçilər', icon: UserCog },
  { path: '/products', label: 'Məhsullar', icon: Package },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isManagementActive = managementItems.some(item => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-secondary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-primary">🦁 Simba</span>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-4">
                {mainMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                        }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}

                {/* Management Dropdown */}
                <div className="relative group flex items-center h-full">
                  <button
                    className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium h-full ${isManagementActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                      }`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    İdarəetmə
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                  <div className="absolute top-16 left-0 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                    {managementItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center ${isActive ? 'bg-gray-50 text-indigo-600' : ''
                            }`}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">{user?.fullName}</span>
              <button
                onClick={logout}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Çıxış
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

