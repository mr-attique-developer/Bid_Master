import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Calendar,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  useGetAllProductsQuery, 
  useDeleteProductMutation,
  useUpdateProductStatusMutation,
  useUpdateAdminFeeStatusMutation,
  useUpdateProductEndDateMutation
} from '../../services/adminApi';
import LoadingSpinner from '../LoadingSpinner';

const ProductManagement = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [feeFilter, setFeeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editType, setEditType] = useState(''); // 'status', 'fee', 'endDate'
  const [editValue, setEditValue] = useState('');

  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useGetAllProductsQuery({ 
    page, 
    limit: 10, 
    status: statusFilter, 
    search,
    adminFeePaid: feeFilter
  });

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateProductStatusMutation();
  const [updateFeeStatus, { isLoading: isUpdatingFee }] = useUpdateAdminFeeStatusMutation();
  const [updateEndDate, { isLoading: isUpdatingDate }] = useUpdateProductEndDateMutation();

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId).unwrap();
      setDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      switch (editType) {
        case 'status':
          await updateStatus({ 
            productId: editingProduct._id, 
            status: editValue 
          }).unwrap();
          break;
        case 'fee':
          await updateFeeStatus({ 
            productId: editingProduct._id, 
            adminFeePaid: editValue === 'true' 
          }).unwrap();
          break;
        case 'endDate':
          await updateEndDate({ 
            productId: editingProduct._id, 
            endsAt: editValue 
          }).unwrap();
          break;
      }
      setEditingProduct(null);
      setEditType('');
      setEditValue('');
      refetch();
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const openEditModal = (product, type) => {
    setEditingProduct(product);
    setEditType(type);
    
    switch (type) {
      case 'status':
        setEditValue(product.status);
        break;
      case 'fee':
        setEditValue(product.adminFeePaid.toString());
        break;
      case 'endDate':
        setEditValue(product.endsAt ? new Date(product.endsAt).toISOString().slice(0, 16) : '');
        break;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'listed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load products</p>
          <button 
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { products = [], pagination = {} } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          </div>
          <div className="text-sm text-gray-500">
            Total: {pagination.total} products
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="listed">Listed</option>
              <option value="sold">Sold</option>
              <option value="ended">Ended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Fee Filter */}
          <select
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Fees</option>
            <option value="true">Fee Paid</option>
            <option value="false">Fee Pending</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {products.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {search || statusFilter !== 'all' || feeFilter ? (
                <>
                  No products match your current search criteria. Try adjusting your filters or search terms.
                </>
              ) : (
                <>
                  There are no products in the database yet. Products will appear here once sellers start creating auctions.
                </>
              )}
            </p>
            {(search || statusFilter !== 'all' || feeFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setFeeFilter('');
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          // Products Table
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {product.image && product.image[0] ? (
                          <img 
                            src={product.image[0].url} 
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${product.startingPrice}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.seller.fullName}</div>
                    <div className="text-sm text-gray-500">{product.seller.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(product, 'status')}
                      className={`px-2 py-1 text-xs font-medium rounded-full hover:opacity-80 ${getStatusBadgeColor(product.status)}`}
                    >
                      {product.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(product, 'fee')}
                      className={`flex items-center px-2 py-1 text-xs font-medium rounded-full hover:opacity-80 ${
                        product.adminFeePaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.adminFeePaid ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => openEditModal(product, 'endDate')}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {product.endsAt ? new Date(product.endsAt).toLocaleDateString() : 'Not set'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(product)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((page - 1) * 10) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * 10, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div className="space-x-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Edit className="h-6 w-6 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Edit {editType === 'status' ? 'Status' : editType === 'fee' ? 'Admin Fee' : 'End Date'}
              </h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product: {editingProduct.title}
              </label>
              
              {editType === 'status' && (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="listed">Listed</option>
                  <option value="sold">Sold</option>
                  <option value="ended">Ended</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}
              
              {editType === 'fee' && (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="false">Pending</option>
                  <option value="true">Paid</option>
                </select>
              )}
              
              {editType === 'endDate' && (
                <input
                  type="datetime-local"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setEditType('');
                  setEditValue('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
                disabled={isUpdatingStatus || isUpdatingFee || isUpdatingDate}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                disabled={isUpdatingStatus || isUpdatingFee || isUpdatingDate}
              >
                {(isUpdatingStatus || isUpdatingFee || isUpdatingDate) ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Trash2 className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.title}</strong>? 
              This action will permanently remove the product and all related data including bids and messages.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm._id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
