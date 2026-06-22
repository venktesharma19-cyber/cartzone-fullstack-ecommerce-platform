import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../lib/api';
import { Cart } from '../types';

interface CartState extends Cart {
  status: 'idle' | 'loading';
}

const initialState: CartState = {
  items: [],
  summary: { quantity: 0, totalCents: 0 },
  status: 'idle'
};

export const fetchCart = createAsyncThunk('cart/fetch', async () => api<Cart>('/cart', { auth: false }));
export const addCartItem = createAsyncThunk('cart/add', async (payload: { productId: string; quantity: number }) => api<Cart>('/cart/items', {
  method: 'POST',
  body: JSON.stringify(payload),
  auth: false
}));
export const updateCartItem = createAsyncThunk('cart/update', async (payload: { productId: string; quantity: number }) => api<Cart>(`/cart/items/${payload.productId}`, {
  method: 'PATCH',
  body: JSON.stringify({ quantity: payload.quantity }),
  auth: false
}));

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const setCart = (state: CartState, action: { payload: Cart }) => {
      state.items = action.payload.items;
      state.summary = action.payload.summary;
      state.status = 'idle';
    };

    builder
      .addCase(fetchCart.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(addCartItem.fulfilled, setCart)
      .addCase(updateCartItem.fulfilled, setCart);
  }
});

export default cartSlice.reducer;
