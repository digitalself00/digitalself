import { createSlice } from '@reduxjs/toolkit';

const initialToken = localStorage.getItem('token') || null;
const initialUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    isLoading: false,
    error: null,
  },
  reducers: {
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setAuthSuccess: (state, action) => {
      const { user, access_token } = action.payload;
      state.token = access_token;
      state.user = user;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    setAuthError: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
});

export const { setAuthLoading, setAuthSuccess, setAuthError, logout, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
