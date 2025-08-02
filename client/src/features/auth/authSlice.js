import { createSlice } from "@reduxjs/toolkit";
import { authApi } from "../../services/authApi";

const initialState = {
  name: "auth",
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      // Save to localStorage
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    // Automatically update state on successful login
    builder.addMatcher(
      authApi.endpoints.loginUser.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.user;
        state.token = payload.token;
        state.isAuthenticated = true;
        localStorage.setItem("token", payload.token);
        localStorage.setItem("user", JSON.stringify(payload.user));
      }
    );

    // Automatically update state on successful registration (step 2)
    builder.addMatcher(
      authApi.endpoints.registerUser2.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.user;
        state.token = payload.token;
        state.isAuthenticated = true;
        localStorage.setItem("token", payload.token);
        localStorage.setItem("user", JSON.stringify(payload.user));
      }
    );

    // Update state when user profile is fetched
    builder.addMatcher(
      authApi.endpoints.getUserProfile.matchFulfilled,
      (state, { payload }) => {
        if (payload.user) {
          state.user = payload.user;
          state.isAuthenticated = true;
          localStorage.setItem("user", JSON.stringify(payload.user));
        }
      }
    );
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
