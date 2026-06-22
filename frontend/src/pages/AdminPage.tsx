import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppSelector } from '../store/hooks';
import { money } from '../lib/money';

export function AdminPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  async function load() {
    const [userData, orderData, productData] = await Promise.all([
      api<any[]>('/admin/users'),
      api<any[]>('/admin/orders'),
      api<any[]>('/admin/products')
    ]);
    setUsers(userData);
    setOrders(orderData);
    setProducts(productData);
  }

  useEffect(() => { load(); }, []);

  if (user?.role !== 'admin') return <Navigate to="/login" replace />;

  async function changeOrderStatus(id: string, status: string) {
    await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  }

  async function toggleProduct(id: string, isActive: boolean) {
    await api(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
    load();
  }

  return (
    <section>
      <h1>Admin panel</h1>
      <div className="adminGrid">
        <div className="panel">
          <h2>Users</h2>
          {users.map((item) => <p key={item.id}><strong>{item.name}</strong> · {item.role} · {item.email}</p>)}
        </div>
        <div className="panel">
          <h2>Orders</h2>
          {orders.map((item) => (
            <div className="adminRow" key={item.id}>
              <span>{item.customer_email}<br />{money(item.total_cents)}</span>
              <select value={item.status} onChange={(e) => changeOrderStatus(item.id, e.target.value)}>
                {['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="panel">
          <h2>Products</h2>
          {products.map((item) => (
            <div className="adminRow" key={item.id}>
              <span>{item.name}<br />{item.seller_email}</span>
              <button onClick={() => toggleProduct(item.id, !item.is_active)}>{item.is_active ? 'Disable' : 'Enable'}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
