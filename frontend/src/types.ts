export type Role = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  inventory: number;
  image_url: string | null;
  category_name: string;
  category_slug: string;
  avg_rating: string | number;
  review_count: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
}

export interface ProductDetails extends Product {
  reviews: Review[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  inventory: number;
}

export interface Cart {
  items: CartItem[];
  summary: {
    quantity: number;
    totalCents: number;
  };
}

export interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  updated_at: string;
}

export interface AiRecommendation extends Product {
  match_score: number;
  match_reasons: string[];
}

export interface AiAssistantResponse {
  answer: string;
  extractedIntent: {
    originalMessage: string;
    normalizedMessage: string;
    category?: string;
    maxPriceCents?: number;
    minPriceCents?: number;
    useCases: string[];
    keywords: string[];
  };
  recommendations: AiRecommendation[];
  followUpQuestions: string[];
}

export interface ProductReviewSummary {
  productId: string;
  productName: string;
  reviewCount: number;
  sentiment: string;
  summary: string;
  highlights: string[];
  ratingBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface SellerAiInsights {
  summary: string;
  actions: Array<{
    type: string;
    title: string;
    detail: string;
    priority: 'high' | 'medium' | 'low' | string;
  }>;
  lowStockCount: number;
  productsTracked: number;
  bestSeller: null | {
    name: string;
    unitsSold: number;
    revenueCents: number;
  };
}
