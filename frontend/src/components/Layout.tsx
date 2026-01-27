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
} from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Məhsullar', icon: Package },
  { path: '/locations', label: 'Lokasiyalar', icon: MapPin },
  { path: '/stock', label: 'Ehtiyat', icon: Warehouse },
  { path: '/pos', label: 'POS', icon: ShoppingCart },
  { path: '/barcode-generator', label: 'Barcode Generator', icon: QrCode },
  { path: '/customers', label: 'Müştərilər', icon: Users },
  { path: '/suppliers', label: 'Təchizatçılar', icon: Truck },
  { path: '/reports', label: 'Hesabatlar', icon: BarChart3 },
  { path: '/users', label: 'İstifadəçilər', icon: UserCog },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-secondary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-primary">🦁 Simba</span>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">{user?.fullName}</span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
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

