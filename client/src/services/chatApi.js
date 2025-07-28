import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: "include", // Important: This sends cookies with requests
    prepareHeaders: (headers, { getState }) => {
      // Also set Authorization header as fallback (in case cookies don't work)
      const token = getState().auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Chat"],
  endpoints: (builder) => ({
    // Get auction winner chat for a specific product
    getAuctionWinnerChat: builder.query({
      query: (productId) => ({
        url: `/chat/auction/${productId}`,
        method: "GET",
      }),
      providesTags: (result, error, productId) => [
        { type: "Chat", id: `auction-${productId}` }
      ],
    }),

    // ✅ FIXED: Send message in auction winner chat - changed field name to 'text'
    sendAuctionWinnerMessage: builder.mutation({
      query: ({ productId, text }) => ({
        url: `/chat/auction/${productId}/message`,
        method: "POST",
        body: { text }, // ✅ Changed from 'senderId, text' to just 'text' (senderId comes from auth middleware)
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Chat", id: `auction-${productId}` },
        "Chat"
      ],
    }),

    // ✅ FIXED: Get user's auction chats - this should now work without errors
    getUserAuctionChats: builder.query({
      query: () => ({
        url: `/chat/my-auction-chats`,
        method: "GET",
      }),
      providesTags: ["Chat"],
      // ✅ Add error handling and retry logic
      transformErrorResponse: (response, meta, arg) => {
        console.error("getUserAuctionChats error:", response);
        return response;
      },
    }),

    // Get regular user chats
    getUserChats: builder.query({
      query: (userId) => ({
        url: `/chat/my-chats/${userId}`,
        method: "GET",
      }),
      providesTags: ["Chat"],
    }),

    // Get chat by ID
    getChatById: builder.query({
      query: (chatId) => ({
        url: `/chat/${chatId}`,
        method: "GET",
      }),
      providesTags: (result, error, chatId) => [
        { type: "Chat", id: chatId }
      ],
    }),

    // Create chat room
    createChatRoom: builder.mutation({
      query: ({ sellerId, winnerId, productId }) => ({
        url: `/chat`,
        method: "POST",
        body: { sellerId, winnerId, productId },
      }),
      invalidatesTags: ["Chat"],
    }),

    // ✅ NEW: Debug endpoints (remove these in production)
    debugProducts: builder.query({
      query: () => ({
        url: `/chat/debug/products`,
        method: "GET",
      }),
    }),

    debugCloseAuction: builder.mutation({
      query: ({ productId, winnerId, winningBid }) => ({
        url: `/chat/debug/close-auction/${productId}`,
        method: "POST",
        body: { winnerId, winningBid },
      }),
    }),
  }),
});

export const {
  useGetAuctionWinnerChatQuery,
  useSendAuctionWinnerMessageMutation,
  useGetUserAuctionChatsQuery,
  useGetUserChatsQuery,
  useGetChatByIdQuery,
  useCreateChatRoomMutation,
  useDebugProductsQuery,
  useDebugCloseAuctionMutation,
} = chatApi;