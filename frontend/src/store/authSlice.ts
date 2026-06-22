import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../lib/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('cartzone_user') ?? 'null'),
  status: 'idle',
  error: null
};

export const login = createAsyncThunk('auth/login', async (payload: { email: string; password: string }) => {
  const response = await api<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: false
  });
  persistAuth(response);
  return response.user;
});

export const register = createAsyncThunk('auth/register', async (payload: { name: string; email: string; password: string; role: 'buyer' | 'seller' }) => {
  const response = await api<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: false
  });
  persistAuth(response);
  return response.user;
});

function persistAuth(response: { user: User; accessToken: string; refreshToken: string }) {
  localStorage.setItem('cartzone_access_token', response.accessToken);
  localStorage.setItem('cartzone_refresh_token', response.refreshToken);
  localStorage.setItem('cartzone_user', JSON.stringify(response.user));
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      localStorage.removeItem('cartzone_access_token');
      localStorage.removeItem('cartzone_refresh_token');
      localStorage.removeItem('cartzone_user');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Login failed';
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Registration failed';
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
