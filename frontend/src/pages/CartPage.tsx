import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCart, updateCartItem } from '../store/cartSlice';
import { money } from '../lib/money';
import { api } from '../lib/api';

export function CartPage() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const user = useAppSelector((state) => state.auth.user);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [shippingAddress, setShippingAddress] = useState({ name: '', line1: '', city: '', state: '', zip: '' });

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  async function checkout(event: FormEvent) {
    event.preventDefault();
    const result = await api<{ checkoutUrl: string }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ shippingAddress })
    });
    setRedirectUrl(result.checkoutUrl);
  }

  if (redirectUrl) window.location.href = redirectUrl;

  return (
    <div className="twoColumn">
      <section>
        <h1>Your cart</h1>
        {!cart.items.length && <p>Your cart is empty.</p>}
        {cart.items.map((item) => (
          <div className="cartItem" key={item.productId}>
            <img src={item.imageUrl ?? ''} alt={item.name} />
            <div>
              <strong>{item.name}</strong>
              <p>{money(item.priceCents)}</p>
              <div className="quantityControls">
                <button onClick={() => dispatch(updateCartItem({ productId: item.productId, quantity: item.quantity - 1 }))}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => dispatch(updateCartItem({ productId: item.productId, quantity: item.quantity + 1 }))}>+</button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <aside className="panel checkoutPanel">
        <h2>Order summary</h2>
        <p>{cart.summary.quantity} items</p>
        <h2>{money(cart.summary.totalCents)}</h2>
        {!user && <Navigate to="/login" replace={false} />}
        <form onSubmit={checkout}>
          <input required placeholder="Full name" value={shippingAddress.name} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} />
          <input required placeholder="Address" value={shippingAddress.line1} onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })} />
          <input required placeholder="City" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
          <input required placeholder="State" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} />
          <input required placeholder="ZIP" value={shippingAddress.zip} onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })} />
          <button disabled={!cart.items.length}>Checkout</button>
        </form>
      </aside>
    </div>
  );
}
