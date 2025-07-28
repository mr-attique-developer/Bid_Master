import { configureStore } from '@reduxjs/toolkit';
import { authApi } from "../services/authApi";
import authReducer from '../features/auth/authSlice';
import { productApi } from '../services/productApi';
import { chatApi } from '../services/chatApi';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    auth: authReducer,
    [productApi.reducerPath] : productApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer
    
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, productApi.middleware, chatApi.middleware)
});