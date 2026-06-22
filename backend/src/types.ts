export type Role = 'buyer' | 'seller' | 'admin';
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartProduct extends CartItem {
  name: string;
  priceCents: number;
  imageUrl: string | null;
  inventory: number;
}
