import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Order } from '../types';
import { money } from '../lib/money';

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api<Order[]>('/orders').then(setOrders);
  }, []);

  return (
    <section>
      <h1>Order history</h1>
      <div className="panelList">
        {orders.map((order) => <OrderStatusCard key={order.id} order={order} />)}
      </div>
    </section>
  );
}

function OrderStatusCard({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status);

  useEffect(() => {
    const token = localStorage.getItem('cartzone_access_token');
    const source = new EventSource(`${import.meta.env.VITE_API_URL}/orders/${order.id}/status/stream?token=${token ?? ''}`);
    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
    };
    source.onerror = () => source.close();
    return () => source.close();
  }, [order.id]);

  return (
    <article className="panel">
      <strong>Order #{order.id.slice(0, 8)}</strong>
      <p>Status: <span className="status">{status}</span></p>
      <p>Total: {money(order.total_cents)}</p>
      <small>{new Date(order.created_at).toLocaleString()}</small>
    </article>
  );
}
