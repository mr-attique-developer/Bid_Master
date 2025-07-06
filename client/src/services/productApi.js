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
        query: (params = {}) => {
            const { search, category } = params;
            const queryParams = new URLSearchParams();
            
            if (search) queryParams.append('search', search);
            if (category && category !== 'all') queryParams.append('category', category);
            
            return {
                url: `/product/getAllProducts${queryParams.toString() ? `?${queryParams}` : ''}`,
                method: "GET",
            };
        },
        providesTags:["Product"]
    }),
    getSingleProduct:builder.query({
      query: (id) => ({
        url: `/product/getProduct/${id}`,
        method: "GET",
      }),
      providesTags:["Product"]
    })
  }),
  
});

export const { useCreateProductMutation, useGetAllProductsQuery, useGetSingleProductQuery } = productApi;