# CartZone API Contract

Base URL: `http://localhost:4000/api`

## Auth

### Register

```http
POST /auth/register
```

```json
{
  "name": "Venktesh Sharma",
  "email": "venktesh@example.com",
  "password": "Password123!",
  "role": "buyer"
}
```

### Login

```http
POST /auth/login
```

```json
{
  "email": "buyer@cartzone.dev",
  "password": "Password123!"
}
```

### Refresh token rotation

```http
POST /auth/refresh
```

```json
{
  "refreshToken": "..."
}
```

### Verify email

```http
POST /auth/verify-email
```

```json
{
  "token": "verification-token-from-register-response-or-console"
}
```

## Products

### List products

```http
GET /products?q=gloves&category=fitness&minPrice=10&maxPrice=100&sort=rating_desc
```

Sort values:

- `newest`
- `price_asc`
- `price_desc`
- `rating_desc`

### Get product details

```http
GET /products/:id
```

### Add/update review

```http
POST /products/:id/reviews
Authorization: Bearer <access-token>
```

```json
{
  "rating": 5,
  "comment": "Great product. Worth the price."
}
```

## Cart

Cart is stored in Redis using `x-cart-session-id`. The frontend saves this ID in localStorage.

### Get cart

```http
GET /cart
x-cart-session-id: guest_123
```

### Add cart item

```http
POST /cart/items
```

```json
{
  "productId": "uuid",
  "quantity": 1
}
```

### Update item quantity

```http
PATCH /cart/items/:productId
```

```json
{
  "quantity": 2
}
```

## Orders

### Checkout

```http
POST /orders/checkout
Authorization: Bearer <access-token>
x-cart-session-id: guest_123
```

```json
{
  "shippingAddress": {
    "name": "Venktesh Sharma",
    "line1": "123 Main St",
    "city": "Dallas",
    "state": "TX",
    "zip": "75039"
  }
}
```

### Stripe webhook

```http
POST /orders/webhook
```

Handles `checkout.session.completed` and marks order as paid.

### Order history

```http
GET /orders
Authorization: Bearer <access-token>
```

### Live status stream

```http
GET /orders/:id/status/stream
Authorization: Bearer <access-token>
```

## Seller

All seller routes require role `seller` or `admin`.

```http
GET /seller/dashboard
POST /seller/products
PATCH /seller/products/:id
```

## Admin

All admin routes require role `admin`.

```http
GET /admin/users
GET /admin/orders
PATCH /admin/orders/:id/status
GET /admin/products
PATCH /admin/products/:id
```

## S3 product image upload

```http
POST /upload/product-image-url
Authorization: Bearer <access-token>
```

```json
{
  "fileType": "image/jpeg"
}
```

## AI Commerce Layer

### AI shopping assistant

```http
POST /ai/assistant
```

```json
{
  "message": "Find me workout gear under $80"
}
```

Returns extracted intent, ranked product recommendations, match scores, and recommendation reasons.

### Semantic-style product search

```http
POST /ai/semantic-search
```

```json
{
  "query": "I need a tech gift with strong ratings"
}
```

Uses the same local AI ranking service as the assistant route.

### Product review summary

```http
GET /ai/products/:id/summary
```

Returns review sentiment, a buyer-friendly summary, common highlights, and positive/neutral/negative counts.

### Seller AI insights

```http
GET /ai/seller/insights
Authorization: Bearer <seller-or-admin-access-token>
```

Returns restock alerts, review/trust gaps, best-seller promotion ideas, and inventory risk signals.
