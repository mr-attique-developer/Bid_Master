import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/admin`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token || localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AdminStats', 'AdminUsers', 'AdminProducts'],
  endpoints: (builder) => ({
    // Dashboard Stats
    getAdminStats: builder.query({
      query: () => '/stats',
      providesTags: ['AdminStats'],
    }),

    // User Management
    getAllUsers: builder.query({
      query: ({ page = 1, limit = 10, role = 'all', search = '' }) => 
        `/users?page=${page}&limit=${limit}&role=${role}&search=${search}`,
      providesTags: ['AdminUsers'],
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),

    // Product Management
    getAllProducts: builder.query({
      query: ({ page = 1, limit = 10, status = 'all', search = '', adminFeePaid }) => {
        let url = `/products?page=${page}&limit=${limit}&status=${status}&search=${search}`;
        if (adminFeePaid !== undefined) {
          url += `&adminFeePaid=${adminFeePaid}`;
        }
        return url;
      },
      providesTags: ['AdminProducts'],
    }),
    updateProductStatus: builder.mutation({
      query: ({ productId, status }) => ({
        url: `/products/${productId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['AdminProducts', 'AdminStats'],
    }),
    updateAdminFeeStatus: builder.mutation({
      query: ({ productId, adminFeePaid }) => ({
        url: `/products/${productId}/admin-fee`,
        method: 'PUT',
        body: { adminFeePaid },
      }),
      invalidatesTags: ['AdminProducts', 'AdminStats'],
    }),
    updateProductEndDate: builder.mutation({
      query: ({ productId, endsAt }) => ({
        url: `/products/${productId}/end-date`,
        method: 'PUT',
        body: { endsAt },
      }),
      invalidatesTags: ['AdminProducts'],
    }),
    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `/products/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminProducts', 'AdminStats'],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAllUsersQuery,
  useDeleteUserMutation,
  useUpdateUserRoleMutation,
  useGetAllProductsQuery,
  useUpdateProductStatusMutation,
  useUpdateAdminFeeStatusMutation,
  useUpdateProductEndDateMutation,
  useDeleteProductMutation,
} = adminApi;
