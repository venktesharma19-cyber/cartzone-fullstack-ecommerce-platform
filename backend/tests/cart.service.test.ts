import { calculateCartTotal } from '../src/services/cart.service';

describe('cart service', () => {
  it('calculates total quantity and price', () => {
    const summary = calculateCartTotal([
      { priceCents: 1000, quantity: 2 },
      { priceCents: 2500, quantity: 1 }
    ]);

    expect(summary).toEqual({ quantity: 3, totalCents: 4500 });
  });
});
