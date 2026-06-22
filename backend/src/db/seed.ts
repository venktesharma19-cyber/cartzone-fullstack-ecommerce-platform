import bcrypt from 'bcryptjs';
import { pool } from './pool';

const demoPassword = 'Password123!';

async function upsertUser(name: string, email: string, role: 'buyer' | 'seller' | 'admin') {
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_email_verified)
     VALUES ($1, $2, $3, $4, TRUE)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, is_email_verified = TRUE
     RETURNING id`,
    [name, email, passwordHash, role]
  );
  return result.rows[0].id as string;
}

async function seed() {
  const buyerId = await upsertUser('Demo Buyer', 'buyer@cartzone.dev', 'buyer');
  const sellerId = await upsertUser('Demo Seller', 'seller@cartzone.dev', 'seller');
  await upsertUser('Demo Admin', 'admin@cartzone.dev', 'admin');

  const categories = [
    ['Electronics', 'electronics'],
    ['Home', 'home'],
    ['Fitness', 'fitness'],
    ['Fashion', 'fashion'],
    ['Books', 'books']
  ];

  for (const [name, slug] of categories) {
    await pool.query(
      `INSERT INTO categories (name, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING`,
      [name, slug]
    );
  }

  const categoryRows = await pool.query('SELECT id, slug FROM categories');
  const categoryBySlug = Object.fromEntries(categoryRows.rows.map((row) => [row.slug, row.id]));

  const products = [
    ['EchoWave Bluetooth Speaker', 'electronics', 'Portable waterproof speaker with deep bass and 18-hour battery life.', 7999, 42, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80'],
    ['AeroFit Boxing Gloves', 'fitness', 'Training gloves built for heavy bag, boxing class, and conditioning work.', 6499, 35, 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=1200&q=80'],
    ['Nordic Desk Lamp', 'home', 'Minimal LED desk lamp with warm/cool settings and metal body.', 4599, 28, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80'],
    ['UrbanFlex Linen Shirt', 'fashion', 'Breathable linen-blend shirt for summer evenings and casual weekends.', 3899, 55, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=80'],
    ['Clean Code Handbook', 'books', 'Practical guide for writing readable, maintainable production software.', 2999, 80, 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80'],
    ['HydroSteel Water Bottle', 'fitness', 'Double-wall insulated bottle that keeps drinks cold through long workouts.', 2499, 100, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80'],
    ['CloudRest Pillow', 'home', 'Memory foam pillow with cooling cover and ergonomic neck support.', 5599, 18, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=80'],
    ['ProTab 11 Tablet', 'electronics', 'Lightweight tablet for streaming, reading, and productivity on the go.', 32999, 16, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80']
  ];

  for (const [name, slug, description, priceCents, inventory, imageUrl] of products) {
    await pool.query(
      `INSERT INTO products (seller_id, category_id, name, description, price_cents, inventory, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (name) DO UPDATE SET
         seller_id = EXCLUDED.seller_id,
         category_id = EXCLUDED.category_id,
         description = EXCLUDED.description,
         price_cents = EXCLUDED.price_cents,
         inventory = EXCLUDED.inventory,
         image_url = EXCLUDED.image_url`,
      [sellerId, categoryBySlug[slug as string], name, description, priceCents, inventory, imageUrl]
    );
  }

  const firstProduct = await pool.query('SELECT id FROM products LIMIT 1');
  if (firstProduct.rowCount) {
    await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1, $2, 5, 'Great quality for the price. Delivery and packaging were smooth.')
       ON CONFLICT (product_id, user_id) DO NOTHING`,
      [firstProduct.rows[0].id, buyerId]
    );
  }

  console.log('Database seed complete');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
