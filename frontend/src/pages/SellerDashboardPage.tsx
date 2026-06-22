import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppSelector } from '../store/hooks';
import { money } from '../lib/money';

interface SellerProduct {
  id: string;
  name: string;
  price_cents: number;
  inventory: number;
  category_name: string;
  is_active: boolean;
}

interface Category { id: string; name: string }

export function SellerDashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState({ orders: 0, units_sold: 0, revenue_cents: 0 });
  const [form, setForm] = useState({ categoryId: '', name: '', description: '', priceCents: 2500, inventory: 10, imageUrl: '' });

  async function load() {
    const [dashboard, categoryData] = await Promise.all([
      api<{ products: SellerProduct[]; sales: typeof sales }>('/seller/dashboard'),
      api<Category[]>('/products/categories', { auth: false })
    ]);
    setProducts(dashboard.products);
    setSales(dashboard.sales);
    setCategories(categoryData);
    if (!form.categoryId && categoryData[0]) setForm((prev) => ({ ...prev, categoryId: categoryData[0].id }));
  }

  useEffect(() => { load(); }, []);

  if (!user || (user.role !== 'seller' && user.role !== 'admin')) return <Navigate to="/login" replace />;

  async function addProduct(event: FormEvent) {
    event.preventDefault();
    await api('/seller/products', { method: 'POST', body: JSON.stringify(form) });
    setForm({ ...form, name: '', description: '', imageUrl: '' });
    load();
  }

  async function updateInventory(product: SellerProduct, inventory: number) {
    await api(`/seller/products/${product.id}`, { method: 'PATCH', body: JSON.stringify({ inventory }) });
    load();
  }

  return (
    <section>
      <h1>Seller dashboard</h1>
      <div className="stats">
        <div><strong>{sales.orders}</strong><span>Orders</span></div>
        <div><strong>{sales.units_sold}</strong><span>Units sold</span></div>
        <div><strong>{money(sales.revenue_cents)}</strong><span>Revenue</span></div>
      </div>

      <div className="twoColumn">
        <form className="panel" onSubmit={addProduct}>
          <h2>Add product</h2>
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input required type="number" placeholder="Price cents" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })} />
          <input required type="number" placeholder="Inventory" value={form.inventory} onChange={(e) => setForm({ ...form, inventory: Number(e.target.value) })} />
          <input placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <button>Add product</button>
        </form>

        <div>
          {products.map((product) => (
            <article className="panel productRow" key={product.id}>
              <div>
                <strong>{product.name}</strong>
                <p>{money(product.price_cents)} · {product.category_name}</p>
              </div>
              <input type="number" value={product.inventory} onChange={(e) => updateInventory(product, Number(e.target.value))} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
