import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include' // For cookies (if using HTTP-only JWT)
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // Register Step 1 (Public)
    registerUser1: builder.mutation({
      query: (userData) => ({
        url: '/user/register1',
        method: 'POST',
        body: userData
      })
    }),

    // Register Step 2 (Protected)
    registerUser2: builder.mutation({
      query: (userData) => ({
        url: '/user/register2',
        method: 'PUT',
        body: userData
      }),
      invalidatesTags: ['User']
    }),

    // Login (Public)
    loginUser: builder.mutation({
      query: (credentials) => ({
        url: '/user/login',
        method: 'POST',
        body: credentials
      }),
      invalidatesTags: ['User']
    }),

    // Get Profile (Protected)
    getUserProfile: builder.query({
      query: () => '/user/profile',
      providesTags: ['User']
    }),

    // Update Profile (Protected)
    updateUserProfile: builder.mutation({
      query: (profileData) => ({
        url: '/user/updateProfile',
        method: 'PUT',
        body: profileData
      }),
      invalidatesTags: ['User']
    }),

    // Update Password (Protected)
    updatePassword: builder.mutation({
      query: (passwords) => ({
        url: '/user/updatePassword',
        method: 'PATCH',
        body: passwords
      })
    }),

    // Logout (Protected)
    logoutUser: builder.mutation({
      query: () => ({
        url: '/user/logout',
        method: 'GET'
      }),
      invalidatesTags: ['User']
    }),

    // Delete Account (Protected)
    deleteAccount: builder.mutation({
      query: () => ({
        url: '/user/deleteAccount',
        method: 'DELETE'
      })
    })
  })
});

// Export hooks for usage in components
export const {
  useRegisterUser1Mutation,
  useRegisterUser2Mutation,
  useLoginUserMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUpdatePasswordMutation,
  useLogoutUserMutation,
  useDeleteAccountMutation
} = authApi;