import { Link, useSearchParams } from 'react-router-dom';

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const demo = params.get('demo');

  return (
    <section className="successCard">
      <h1>Order confirmed</h1>
      <p>Your payment was completed{demo ? ' in demo mode' : ''}.</p>
      {orderId && <p>Order #{orderId.slice(0, 8)}</p>}
      <Link className="buttonLink" to="/orders">Track order</Link>
    </section>
  );
}
