import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  History, 
  LogOut, 
  Layers,
  Users as UsersIcon,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, token, API_URL } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setLowStockCount(data.lowStockCount);
        }
      } catch (err) {
        console.error('Sidebar stats fetch failed:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [token, API_URL]);

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Transactions', path: '/transactions', icon: History }
  ];

  // Add Admin only routes
  if (user?.role === 'admin') {
    navigation.push({ name: 'System Audit', path: '/audit-log', icon: ShieldAlert });
    navigation.push({ name: 'Users', path: '/users', icon: UsersIcon });
  }

  return (
    <div className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col glass-panel border-y-0 border-l-0 border-r">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-glassBorder">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-accentBlue to-accentTeal text-white shadow-lg shadow-teal-500/10">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-lg text-primaryText">SmartStock</h1>
          <span className="text-xs font-semibold text-accentTeal tracking-wider uppercase">Inventory v1.0</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-accentBlue/20 to-accentTeal/10 text-accentBlue border-l-4 border-accentBlue shadow-md shadow-accentBlue/5'
                  : 'text-secondaryText hover:bg-white/5 hover:text-primaryText border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110 text-accentBlue' : ''}`} />
                {item.name}
              </div>
              
              {item.badge && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accentRose text-[10px] font-black text-white animate-pulse-subtle">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Session Drawer info & Logout */}
      <div className="p-4 border-t border-glassBorder bg-darkBg/30">
        <div className="flex items-center gap-3 px-2 py-1 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accentPurple/20 text-accentPurple font-semibold text-sm border border-accentPurple/30">
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-primaryText">{user?.username}</p>
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              user?.role === 'admin' 
                ? 'bg-accentPurple/10 text-accentPurple border border-accentPurple/20' 
                : 'bg-accentBlue/10 text-accentBlue border border-accentBlue/20'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-400 border border-rose-950/20 bg-rose-950/10 hover:bg-rose-900/20 hover:text-rose-200 hover:border-rose-800/40 transition-all duration-200"
        >
          <LogOut className="h-4.5 w-4.5" />
          Logout Session
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
