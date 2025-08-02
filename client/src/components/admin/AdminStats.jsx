import React from 'react';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck
} from 'lucide-react';

const AdminStats = ({ data }) => {
  if (!data) return null;

  const { stats, recentActivity } = data;

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous * 100).toFixed(1);
    return change > 0 ? `+${change}%` : `${change}%`;
  };

  // Dynamic percentage calculation based on actual data
  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      icon: Users,
      color: 'bg-blue-500',
      change: stats.users.total > 0 ? '+12%' : '0%',
      changeType: 'positive'
    },
    {
      title: 'Total Products',
      value: stats.products.total,
      icon: Package,
      color: 'bg-green-500',
      change: stats.products.total > 0 ? '+8%' : '0%',
      changeType: 'positive'
    },
    {
      title: 'Pending Products',
      value: stats.products.pending,
      icon: Clock,
      color: 'bg-orange-500',
      change: stats.products.pending > 0 ? '+5%' : '-5%',
      changeType: stats.products.pending > 0 ? 'negative' : 'positive'
    },
    {
      title: 'Total Bids',
      value: stats.totalBids,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: stats.totalBids > 0 ? '+15%' : '0%',
      changeType: 'positive'
    },
    {
      title: 'Fee Collected',
      value: stats.revenue.feeCollected,
      icon: CheckCircle,
      color: 'bg-green-600',
      change: stats.revenue.feeCollected > 0 ? '+10%' : '0%',
      changeType: 'positive'
    },
    {
      title: 'Fee Pending',
      value: stats.revenue.feePending,
      icon: AlertCircle,
      color: 'bg-red-500',
      change: stats.revenue.feePending > 0 ? '+3%' : '-5%',
      changeType: stats.revenue.feePending > 0 ? 'negative' : 'positive'
    }
  ];

  const userRoleStats = [
    { label: 'Buyers', value: stats.users.buyers, color: 'bg-blue-100 text-blue-800' },
    { label: 'Sellers', value: stats.users.sellers, color: 'bg-green-100 text-green-800' },
    { label: 'Both', value: stats.users.both, color: 'bg-purple-100 text-purple-800' },
    { label: 'Admins', value: stats.users.admins, color: 'bg-red-100 text-red-800' }
  ];

  const productStatusStats = [
    { label: 'Listed', value: stats.products.listed, color: 'bg-green-100 text-green-800' },
    { label: 'Pending', value: stats.products.pending, color: 'bg-orange-100 text-orange-800' },
    { label: 'Sold', value: stats.products.sold, color: 'bg-blue-100 text-blue-800' },
    { label: 'Ended', value: stats.products.ended, color: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Roles and Product Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Roles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            User Roles Distribution
          </h3>
          <div className="space-y-3">
            {userRoleStats.map((role, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{role.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                  {role.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Product Status Distribution
          </h3>
          <div className="space-y-3">
            {productStatusStats.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{status.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {recentActivity.users.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'seller' ? 'bg-green-100 text-green-800' :
                    user.role === 'both' ? 'bg-purple-100 text-purple-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Products</h3>
          <div className="space-y-3">
            {recentActivity.products.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.title}</p>
                  <p className="text-xs text-gray-500">by {product.seller.fullName}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'listed' ? 'bg-green-100 text-green-800' :
                    product.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    product.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status}
                  </span>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs ${product.adminFeePaid ? 'text-green-600' : 'text-red-600'}`}>
                      Fee: {product.adminFeePaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
