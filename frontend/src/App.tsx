import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { AdminPage } from './pages/AdminPage';
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/seller" element={<SellerDashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </Layout>
  );
}
