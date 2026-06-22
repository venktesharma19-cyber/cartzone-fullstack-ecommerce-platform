import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ProductDetails } from '../types';
import { money } from '../lib/money';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addCartItem } from '../store/cartSlice';

export function ProductPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });

  async function load() {
    if (!id) return;
    setProduct(await api<ProductDetails>(`/products/${id}`, { auth: false }));
  }

  useEffect(() => { load(); }, [id]);

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    await api(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(review) });
    setReview({ rating: 5, comment: '' });
    load();
  }

  if (!product) return <p>Loading product...</p>;

  return (
    <div className="detailLayout">
      <img className="detailImage" src={product.image_url ?? ''} alt={product.name} />
      <section>
        <span className="pill">{product.category_name}</span>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="rating">★ {Number(product.avg_rating).toFixed(1)} · {product.review_count} reviews</div>
        <h2>{money(product.price_cents)}</h2>
        <p>{product.inventory} left in stock</p>
        <button onClick={() => dispatch(addCartItem({ productId: product.id, quantity: 1 }))}>Add to cart</button>

        <section className="panel">
          <h2>Reviews</h2>
          {user && (
            <form className="reviewForm" onSubmit={submitReview}>
              <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
                {[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
              </select>
              <input placeholder="Write a review" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
              <button>Submit</button>
            </form>
          )}
          {product.reviews.map((item) => (
            <div className="review" key={item.id}>
              <strong>★ {item.rating} · {item.user_name}</strong>
              <p>{item.comment}</p>
            </div>
          ))}
        </section>
      </section>
    </div>
  );
}
