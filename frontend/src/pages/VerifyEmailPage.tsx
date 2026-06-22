import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Verifying email...');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setMessage('Missing verification token.');
      return;
    }
    api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }), auth: false })
      .then(() => setMessage('Email verified successfully.'))
      .catch((err) => setMessage(err.message));
  }, [params]);

  return <section className="successCard"><h1>{message}</h1></section>;
}
