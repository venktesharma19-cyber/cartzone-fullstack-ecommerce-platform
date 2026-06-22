import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

interface Category { id: string; name: string; slug: string }

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState({ q: '', category: '', minPrice: '', maxPrice: '', sort: 'newest' });

  async function loadProducts(nextFilters = filters) {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => value && params.set(key, value));
    const data = await api<Product[]>(`/products?${params.toString()}`, { auth: false });
    setProducts(data);
  }

  useEffect(() => {
    api<Category[]>('/products/categories', { auth: false }).then(setCategories);
    loadProducts();
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    loadProducts();
  }

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Full-stack portfolio project</p>
          <h1>Shop smarter with CartZone.</h1>
          <p>Search products, manage carts, checkout securely, track orders, and run seller/admin workflows in one clean app.</p>
        </div>
        <div className="heroCard">
          <strong>Stack</strong>
          <span>React · Node · PostgreSQL · Redis · Stripe · Docker</span>
        </div>
      </section>

      <form className="filters" onSubmit={submit}>
        <input placeholder="Search products" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
        </select>
        <input placeholder="Min $" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
        <input placeholder="Max $" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
        <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating_desc">Best rated</option>
        </select>
        <button>Apply</button>
      </form>

      <section className="grid">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </section>
    </>
  );
}
