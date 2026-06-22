import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { productRoutes } from './routes/product.routes';
import { cartRoutes } from './routes/cart.routes';
import { orderRoutes } from './routes/order.routes';
import { sellerRoutes } from './routes/seller.routes';
import { adminRoutes } from './routes/admin.routes';
import { uploadRoutes } from './routes/upload.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { aiRoutes } from './routes/ai.routes';
import { errorHandler, notFound } from './middleware/errorHandler';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
  exposedHeaders: ['x-cart-session-id']
}));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cartzone-api' });
});

app.use('/api/orders/webhook', webhookRoutes);
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);
