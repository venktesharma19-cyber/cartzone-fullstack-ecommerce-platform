import { Link } from 'react-router-dom';
import { Product } from '../types';
import { money } from '../lib/money';
import { useAppDispatch } from '../store/hooks';
import { addCartItem } from '../store/cartSlice';

export function ProductCard({ product }: { product: Product }) {
  const dispatch = useAppDispatch();

  return (
    <article className="productCard">
      <Link to={`/products/${product.id}`}>
        <img src={product.image_url ?? '/placeholder.png'} alt={product.name} />
      </Link>
      <div className="productBody">
        <span className="pill">{product.category_name}</span>
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <p>{product.description}</p>
        <div className="rating">★ {Number(product.avg_rating).toFixed(1)} · {product.review_count} reviews</div>
        <div className="cardFooter">
          <strong>{money(product.price_cents)}</strong>
          <button onClick={() => dispatch(addCartItem({ productId: product.id, quantity: 1 }))}>Add to cart</button>
        </div>
      </div>
    </article>
  );
}
