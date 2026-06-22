import { calculateOrderTotal } from '../src/services/order.service';

describe('order service', () => {
  it('calculates order totals from order items', () => {
    expect(calculateOrderTotal([
      { quantity: 2, unitPriceCents: 3499 },
      { quantity: 1, unitPriceCents: 1200 }
    ])).toBe(8198);
  });
});
