import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${import.meta.env.VITE_API_URL}/user`,
    credentials: 'include', // For cookies (if using HTTP-only JWT)
    prepareHeaders: (headers, { getState }) => {
      // Get token from Redux state
      const token = getState().auth.token;
      
      // If we have a token, set the authorization header
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // Register Step 1 (Public)
    registerUser1: builder.mutation({
      query: (userData) => ({
        url: '/register1',
        method: 'POST',
        body: userData
      })
    }),

    // Register Step 2 (Protected)
    registerUser2: builder.mutation({
      query: (userData) => ({
        url: '/register2',
        method: 'PUT',
        body: userData
      }),
      invalidatesTags: ['User']
    }),

    // Verify Email (Public)
    verifyEmail: builder.mutation({
      query: (token) => ({
        url: `/verify-email/${token}`,
        method: 'GET'
      }),
      invalidatesTags: ['User']
    }),

    // Resend Verification Email (Public)
    resendVerificationEmail: builder.mutation({
      query: (emailData) => ({
        url: '/resend-verification',
        method: 'POST',
        body: emailData
      })
    }),

    // Login (Public)
    loginUser: builder.mutation({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials
      }),
      invalidatesTags: ['User']
    }),

    // Get Profile (Protected)
    getUserProfile: builder.query({
      query: () => '/profile',
      providesTags: ['User']
    }),

    // Update Profile (Protected)
    updateUserProfile: builder.mutation({
      query: (profileData) => ({
        url: '/updateProfile',
        method: 'PUT',
        body: profileData
      }),
      invalidatesTags: ['User']
    }),

    // Update Password (Protected)
    updatePassword: builder.mutation({
      query: (passwords) => ({
        url: '/updatePassword',
        method: 'PATCH',
        body: passwords
      })
    }),

    // Logout (Protected)
    logoutUser: builder.mutation({
      query: () => ({
        url: '/logout',
        method: 'GET'
      }),
      invalidatesTags: ['User']
    }),

    // Delete Account (Protected)
    deleteAccount: builder.mutation({
      query: () => ({
        url: '/deleteAccount',
        method: 'DELETE'
      })
    })
  })
});

// Export hooks for usage in components
export const {
  useRegisterUser1Mutation,
  useRegisterUser2Mutation,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
  useLoginUserMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUpdatePasswordMutation,
  useLogoutUserMutation,
  useDeleteAccountMutation
} = authApi;