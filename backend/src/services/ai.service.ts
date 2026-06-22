import { query } from '../db/pool';

export interface AiIntent {
  originalMessage: string;
  normalizedMessage: string;
  category?: string;
  maxPriceCents?: number;
  minPriceCents?: number;
  useCases: string[];
  keywords: string[];
}

export interface AiProductRecommendation {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  inventory: number;
  image_url: string | null;
  category_name: string | null;
  category_slug: string | null;
  avg_rating: string | number;
  review_count: number;
  match_score: number;
  match_reasons: string[];
}

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  electronics: ['electronics', 'gadget', 'speaker', 'tablet', 'tech', 'device', 'battery', 'streaming'],
  fitness: ['fitness', 'workout', 'boxing', 'gym', 'training', 'hydration', 'water bottle', 'heavy bag'],
  home: ['home', 'desk', 'lamp', 'pillow', 'room', 'office', 'sleep', 'decor'],
  fashion: ['fashion', 'shirt', 'linen', 'outfit', 'clothes', 'style', 'summer', 'party'],
  books: ['book', 'books', 'reading', 'software', 'clean code', 'developer', 'programming']
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'best', 'but', 'buy', 'can', 'for', 'gift', 'good',
  'i', 'in', 'is', 'it', 'me', 'need', 'of', 'on', 'or', 'please', 'product', 'products', 'show',
  'something', 'that', 'the', 'this', 'to', 'under', 'want', 'with', 'you'
]);

export function extractIntent(message: string): AiIntent {
  const normalizedMessage = message.trim().toLowerCase();
  const category = Object.entries(CATEGORY_SYNONYMS).find(([, words]) =>
    words.some((word) => normalizedMessage.includes(word))
  )?.[0];

  const underMatch = normalizedMessage.match(/(?:under|below|less than|around|max|budget)\s*\$?\s*(\d{1,5})/i);
  const overMatch = normalizedMessage.match(/(?:over|above|more than|min)\s*\$?\s*(\d{1,5})/i);

  const keywords = normalizedMessage
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 12);

  const useCases = [
    ...new Set(
      Object.values(CATEGORY_SYNONYMS)
        .flat()
        .filter((word) => normalizedMessage.includes(word))
    )
  ].slice(0, 6);

  return {
    originalMessage: message,
    normalizedMessage,
    category,
    maxPriceCents: underMatch ? Number(underMatch[1]) * 100 : undefined,
    minPriceCents: overMatch ? Number(overMatch[1]) * 100 : undefined,
    useCases,
    keywords
  };
}

export async function getAiRecommendations(message: string) {
  const intent = extractIntent(message || 'show me popular products');
  const products = await loadProductCatalog();
  const scored = products
    .map((product) => scoreProduct(product, intent))
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 6);

  const top = scored[0];
  const categoryPhrase = intent.category ? `${intent.category} products` : 'products';
  const budgetPhrase = intent.maxPriceCents ? ` under $${Math.round(intent.maxPriceCents / 100)}` : '';

  return {
    answer: top
      ? `I found ${categoryPhrase}${budgetPhrase} that fit your intent. I ranked them using category match, keyword relevance, rating, inventory availability, and price fit.`
      : 'I could not find a strong match yet. Try asking by use case, category, budget, or rating.',
    extractedIntent: intent,
    recommendations: scored,
    followUpQuestions: [
      'Do you want the best rated option or the lowest price?',
      'Is this for yourself or a gift?',
      'Should I prioritize fast-moving inventory or premium products?'
    ]
  };
}

export async function getProductReviewSummary(productId: string) {
  const product = await query(
    `SELECT p.id, p.name, COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating, COUNT(r.id)::int AS review_count
     FROM products p
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE p.id = $1
     GROUP BY p.id, p.name`,
    [productId]
  );

  const reviews = await query(
    `SELECT rating, comment FROM reviews WHERE product_id = $1 ORDER BY created_at DESC LIMIT 25`,
    [productId]
  );

  if (!product.rowCount) {
    return null;
  }

  const reviewRows = reviews.rows as Array<{ rating: number; comment: string }>;
  const positive = reviewRows.filter((review) => review.rating >= 4).length;
  const neutral = reviewRows.filter((review) => review.rating === 3).length;
  const negative = reviewRows.filter((review) => review.rating <= 2).length;
  const avgRating = Number(product.rows[0].avg_rating ?? 0);

  const commonSignals = extractCommonSignals(reviewRows.map((review) => review.comment));

  return {
    productId,
    productName: product.rows[0].name,
    reviewCount: Number(product.rows[0].review_count),
    sentiment: avgRating >= 4.3 ? 'very positive' : avgRating >= 3.7 ? 'positive' : avgRating >= 3 ? 'mixed' : 'needs attention',
    summary: reviewRows.length
      ? `Customers are generally ${avgRating >= 4 ? 'happy with' : 'mixed on'} this product. The strongest signals are ${commonSignals.length ? commonSignals.join(', ') : 'quality, value, and delivery experience'}.`
      : 'No customer reviews yet. Once reviews are added, CartZone generates a buyer-friendly review summary automatically.',
    highlights: commonSignals.length ? commonSignals : ['Quality feedback', 'Value perception', 'Delivery experience'],
    ratingBreakdown: { positive, neutral, negative }
  };
}

export async function getSellerAiInsights(sellerId: string, role: string) {
  const sellerFilter = role === 'admin' ? '' : 'WHERE p.seller_id = $1';
  const params = role === 'admin' ? [] : [sellerId];

  const productData = await query(
    `SELECT p.id, p.name, p.inventory, p.price_cents, c.name AS category_name,
            COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
            COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0)::int AS revenue_cents,
            COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
            COUNT(r.id)::int AS review_count
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN order_items oi ON oi.product_id = p.id
     LEFT JOIN reviews r ON r.product_id = p.id
     ${sellerFilter}
     GROUP BY p.id, c.name
     ORDER BY revenue_cents DESC, p.inventory ASC
     LIMIT 30`,
    params
  );

  const products = productData.rows as Array<{
    id: string;
    name: string;
    inventory: number;
    price_cents: number;
    category_name: string | null;
    units_sold: number;
    revenue_cents: number;
    avg_rating: string | number;
    review_count: number;
  }>;

  const lowStock = products.filter((product) => product.inventory <= 10);
  const noReviews = products.filter((product) => product.review_count === 0);
  const bestSeller = [...products].sort((a, b) => b.units_sold - a.units_sold)[0];

  const actions = [
    ...lowStock.slice(0, 3).map((product) => ({
      type: 'inventory',
      title: `Restock ${product.name}`,
      detail: `${product.inventory} units left. Consider restocking before running paid promotions.`,
      priority: product.inventory <= 3 ? 'high' : 'medium'
    })),
    ...noReviews.slice(0, 2).map((product) => ({
      type: 'trust',
      title: `Collect reviews for ${product.name}`,
      detail: 'This product has no reviews yet. Add post-purchase review nudges to improve buyer confidence.',
      priority: 'medium'
    }))
  ];

  if (bestSeller && bestSeller.units_sold > 0) {
    actions.unshift({
      type: 'growth',
      title: `Promote ${bestSeller.name}`,
      detail: `It is currently your strongest seller with ${bestSeller.units_sold} units sold. Feature it in the hero or deals section.`,
      priority: 'high'
    });
  }

  return {
    summary: products.length
      ? 'AI insights generated from inventory, order items, revenue, ratings, and review coverage.'
      : 'No seller products found yet. Add products to unlock AI merchandising insights.',
    actions: actions.slice(0, 6),
    lowStockCount: lowStock.length,
    productsTracked: products.length,
    bestSeller: bestSeller
      ? { name: bestSeller.name, unitsSold: bestSeller.units_sold, revenueCents: bestSeller.revenue_cents }
      : null
  };
}

async function loadProductCatalog(): Promise<AiProductRecommendation[]> {
  const result = await query(
    `SELECT p.id, p.name, p.description, p.price_cents, p.inventory, p.image_url,
            c.name AS category_name, c.slug AS category_slug,
            COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
            COUNT(r.id)::int AS review_count
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE p.is_active = TRUE
     GROUP BY p.id, c.name, c.slug
     ORDER BY p.created_at DESC
     LIMIT 100`
  );

  return result.rows.map((row) => ({ ...row, match_score: 0, match_reasons: [] }));
}

function scoreProduct(product: AiProductRecommendation, intent: AiIntent): AiProductRecommendation {
  let score = 0;
  const reasons: string[] = [];
  const haystack = `${product.name} ${product.description} ${product.category_name ?? ''} ${product.category_slug ?? ''}`.toLowerCase();

  if (intent.category && product.category_slug === intent.category) {
    score += 35;
    reasons.push(`Matches ${intent.category} category`);
  }

  const keywordHits = intent.keywords.filter((keyword) => haystack.includes(keyword));
  if (keywordHits.length) {
    score += keywordHits.length * 8;
    reasons.push(`Matches keywords: ${keywordHits.slice(0, 4).join(', ')}`);
  }

  const avgRating = Number(product.avg_rating || 0);
  if (avgRating >= 4) {
    score += 12;
    reasons.push('Strong customer rating');
  }

  if (product.inventory > 0) {
    score += 10;
    reasons.push('Available in stock');
  }

  if (intent.maxPriceCents && product.price_cents <= intent.maxPriceCents) {
    score += 15;
    reasons.push(`Fits budget under $${Math.round(intent.maxPriceCents / 100)}`);
  }

  if (intent.minPriceCents && product.price_cents >= intent.minPriceCents) {
    score += 8;
    reasons.push('Fits premium price range');
  }

  if (!intent.category && !intent.keywords.length) {
    score += Number(product.review_count) + Math.min(product.inventory, 20);
  }

  return {
    ...product,
    match_score: Math.max(score, 1),
    match_reasons: reasons.length ? reasons : ['Popular catalog match']
  };
}

function extractCommonSignals(comments: string[]) {
  const signals = [
    { label: 'quality', words: ['quality', 'built', 'durable', 'smooth', 'solid'] },
    { label: 'value for money', words: ['price', 'value', 'worth', 'budget'] },
    { label: 'delivery experience', words: ['delivery', 'packaging', 'shipped', 'fast'] },
    { label: 'design and usability', words: ['design', 'easy', 'comfortable', 'minimal', 'portable'] },
    { label: 'performance', words: ['battery', 'bass', 'support', 'cooling', 'training'] }
  ];

  const text = comments.join(' ').toLowerCase();
  return signals
    .filter((signal) => signal.words.some((word) => text.includes(word)))
    .map((signal) => signal.label)
    .slice(0, 4);
}
