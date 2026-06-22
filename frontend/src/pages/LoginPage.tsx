import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, register } from '../store/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const { user, error } = useAppSelector((state) => state.auth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: 'buyer@cartzone.dev', password: 'Password123!', role: 'buyer' as 'buyer' | 'seller' });

  if (user) return <Navigate to="/" replace />;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === 'login') {
      dispatch(login({ email: form.email, password: form.password }));
    } else {
      dispatch(register(form));
    }
  }

  return (
    <section className="authCard">
      <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
      <p>Try buyer@cartzone.dev, seller@cartzone.dev, or admin@cartzone.dev with Password123!</p>
      <form onSubmit={submit}>
        {mode === 'register' && <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        <input required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {mode === 'register' && (
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'buyer' | 'seller' })}>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
        )}
        {error && <p className="error">{error}</p>}
        <button>{mode === 'login' ? 'Login' : 'Register'}</button>
      </form>
      <button className="secondary" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
      </button>
    </section>
  );
}
