import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  Truck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag,
  TrendingUp,
  FileText,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import TrendChart from '../components/Charts/TrendChart';
import CategoryChart from '../components/Charts/CategoryChart';

const Dashboard = () => {
  const { token, API_URL } = useAuth();
  const headers = { 'Authorization': `Bearer ${token}` };

  // Fetch Dashboard Stats with TanStack Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/dashboard/stats`, { headers });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accentBlue border-t-transparent"></div>
          <p className="font-semibold text-secondaryText tracking-wide animate-pulse-subtle">Compiling inventory metrics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-accentRose">
        <h3 className="text-xl font-bold">Failed to load dashboard data.</h3>
        <p className="text-sm">Please check your connection or try logging in again.</p>
      </div>
    );
  }

  const stats = {
    totalProducts: data?.totalProducts || 0,
    totalStockValue: data?.totalStockValue || 0,
    lowStockCount: data?.lowStockCount || 0,
    totalSuppliers: data?.totalSuppliers || 0,
    totalSalesValue: data?.totalSalesValue || 0,
    totalPurchasesValue: data?.totalPurchasesValue || 0
  };

  const recentTransactions = data?.recentTransactions || [];
  const trendData = data?.trendData || [];
  const categoryData = data?.categoryData || [];

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-7xl mx-auto pb-16">
      {/* Visual Header Welcome section */}
      <div className="relative glass-panel rounded-3xl p-6 overflow-hidden border border-glassBorder flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accentBlue/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="space-y-1 z-10">
          <h3 className="text-2xl font-bold tracking-tight text-primaryText">Inventory Intelligence</h3>
          <p className="text-sm text-secondaryText">Real-time health summary and business trends at a glance.</p>
        </div>
        <div className="flex items-center gap-3 z-10 shrink-0">
          <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accentBlue/20 to-accentTeal/15 border border-accentBlue/30 px-4.5 py-2.5 text-xs font-bold text-accentBlue shadow-md shadow-accentBlue/5">
            <TrendingUp className="h-4.5 w-4.5" />
            Operational Health: 100%
          </div>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Catalog Products"
          value={stats.totalProducts}
          icon={Package}
          colorClass="bg-accentBlue/10 text-accentBlue"
          subtext="Active SKUs in directory"
        />
        <MetricCard
          title="Total Stock Valuation"
          value={`$${Number(stats.totalStockValue).toLocaleString()}`}
          icon={DollarSign}
          colorClass="bg-accentTeal/10 text-accentTeal text-emerald-400"
          borderClass="border-emerald-500/20"
          subtext="Net market asset value"
        />
        <MetricCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          colorClass={stats.lowStockCount > 0 ? "bg-accentRose/20 text-accentRose pulse-glow-rose" : "bg-accentAmber/10 text-accentAmber"}
          borderClass={stats.lowStockCount > 0 ? "border-rose-500/30" : "border-glassBorder"}
          subtext={stats.lowStockCount > 0 ? "Critical reorders required!" : "All stocks above threshold"}
        />
        <MetricCard
          title="Registered Suppliers"
          value={stats.totalSuppliers}
          icon={Truck}
          colorClass="bg-accentPurple/10 text-accentPurple"
          subtext="Linked distributor profiles"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="glass-panel rounded-3xl p-6 border border-glassBorder space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-bold text-primaryText flex items-center gap-2">
              <Activity className="h-5 w-5 text-accentRose" />
              Sales & Purchase Trends
            </h4>
            <span className="text-[10px] uppercase font-bold text-secondaryText tracking-widest bg-white/5 px-2 py-1 rounded-lg">Last 7 Days</span>
          </div>
          <TrendChart data={trendData} />
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-glassBorder space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-bold text-primaryText flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-accentBlue" />
              Inventory Distribution
            </h4>
            <span className="text-[10px] uppercase font-bold text-secondaryText tracking-widest bg-white/5 px-2 py-1 rounded-lg">By Category</span>
          </div>
          <CategoryChart data={categoryData} />
        </div>
      </div>

      {/* Business Summary & Recent Transactions section */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold tracking-tight text-primaryText">Business Summary</h4>
          </div>

          <div className="flex-1 glass-panel rounded-3xl p-5 border border-glassBorder space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-glassBorder px-4 py-4 hover:bg-white/8 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-secondaryText uppercase font-bold">Total Sales</p>
                    <p className="text-lg font-black text-primaryText">${Number(stats.totalSalesValue).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-glassBorder px-4 py-4 hover:bg-white/8 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accentBlue/10 flex items-center justify-center text-accentBlue">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-secondaryText uppercase font-bold">Total Purchases</p>
                    <p className="text-lg font-black text-primaryText">${Number(stats.totalPurchasesValue).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-glassBorder">
                <p className="text-xs text-secondaryText text-center italic">Calculated from historical transaction logs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Recent Transaction Audit Log */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold tracking-tight text-primaryText">Recent Transactions Ledger</h4>
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-glassBorder px-3 py-1 text-xs text-secondaryText font-medium">
              <FileText className="h-3.5 w-3.5" />
              Audit Log
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-glassBorder overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-secondaryText mb-4 border border-glassBorder">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h5 className="font-semibold text-sm text-primaryText">No Transactions Logged</h5>
                <p className="text-xs text-secondaryText mt-1 max-w-xs">Transactions logged will populate here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glassBorder bg-white/3">
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-secondaryText">Type</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-secondaryText">Product</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-secondaryText">Quantity</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-secondaryText">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glassBorder">
                    {recentTransactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                            tx.type === 'purchase'
                              ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40'
                              : 'bg-accentRose/15 text-accentRose border border-accentRose/25'
                          }`}>
                            <span className="capitalize">{tx.type}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-sm text-primaryText leading-none">{tx.productName || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primaryText">
                          {tx.quantity} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-secondaryText font-medium">
                          {new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
