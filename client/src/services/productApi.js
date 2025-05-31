import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: "include", // For cookies (if using HTTP-only JWT)
  }),
  tagTypes: ["Product"],
  endpoints: (builder) => ({
    createProduct: builder.mutation({
      query: (formData) => ({
        url: "/product/createProduct",
        method: "POST",
        body: formData,
      }),
      invalidatesTags:["Product"]
    }),
    getAllProducts: builder.query({
        query: ()=>({
            url: "/product/getAllProducts",
            method: "GET",
        }),
        providesTags:["Product"]
    })
  }),
});

export const { useCreateProductMutation, useGetAllProductsQuery } = productApi;