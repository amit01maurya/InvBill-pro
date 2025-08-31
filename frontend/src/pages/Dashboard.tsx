import React from 'react';
import { Package, Receipt, TrendingUp, AlertTriangle, Users, ShoppingCart } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { products, invoices, notifications, getRevenueByPeriod } = useInventory();

  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);
  const totalProducts = products.length;
  const totalInvoices = invoices.length;
  const dailyRevenue = getRevenueByPeriod('daily');
  const monthlyRevenue = getRevenueByPeriod('monthly');

  const recentInvoices = invoices
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const unreadNotifications = notifications.filter(n => !n.read).slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Total Invoices',
      value: totalInvoices,
      icon: Receipt,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'Daily Revenue',
      value: formatCurrency(dailyRevenue),
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+15%',
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-3%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-blue-600" />
              Recent Invoices
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">{invoice.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(invoice.totalINR)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications & Low Stock */}
        <div className="space-y-6">
          {/* Revenue Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Today</span>
                <span className="font-semibold">{formatCurrency(dailyRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">{formatCurrency(monthlyRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Low Stock Alerts
              </h3>
            </div>
            <div className="p-6">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No low stock items</p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-red-900">{product.name}</p>
                        <p className="text-sm text-red-700">Only {product.stock} left</p>
                      </div>
                      <div className="text-red-600">
                        <AlertTriangle size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;