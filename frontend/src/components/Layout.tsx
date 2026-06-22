import { Link, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCart } from '../store/cartSlice';
import { logout } from '../store/authSlice';

export function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart.summary);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  return (
    <div>
      <header className="topbar">
        <Link to="/" className="brand">🛍️ CartZone</Link>
        <nav>
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/cart">Cart ({cart.quantity})</NavLink>
          {user && <NavLink to="/orders">Orders</NavLink>}
          {(user?.role === 'seller' || user?.role === 'admin') && <NavLink to="/seller">Seller</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          {user ? (
            <button className="linkButton" onClick={() => dispatch(logout())}>Logout</button>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
