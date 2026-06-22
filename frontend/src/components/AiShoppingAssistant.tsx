import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { money } from '../lib/money';
import { AiAssistantResponse } from '../types';

const EXAMPLE_PROMPTS = [
  'Find me workout gear under $80',
  'I need a tech gift with strong ratings',
  'Show home office products that feel premium',
  'What should I buy for a summer party outfit?'
];

export function AiShoppingAssistant() {
  const [message, setMessage] = useState(EXAMPLE_PROMPTS[0]);
  const [result, setResult] = useState<AiAssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function askAssistant(event?: FormEvent, prompt = message) {
    event?.preventDefault();
    if (!prompt.trim()) return;
    setError('');
    setLoading(true);
    try {
      const response = await api<AiAssistantResponse>('/ai/assistant', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ message: prompt })
      });
      setResult(response);
      setMessage(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI assistant failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="aiPanel">
      <div className="aiPanelHeader">
        <div>
          <p className="eyebrow">AI shopping layer</p>
          <h2>Ask CartZone AI what to buy</h2>
          <p>Natural-language product discovery with intent extraction, budget detection, ranking reasons, and buyer-friendly recommendations.</p>
        </div>
        <span className="aiBadge">2026-ready</span>
      </div>

      <form className="aiAskBar" onSubmit={askAssistant}>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Example: find me fitness products under $80"
        />
        <button disabled={loading}>{loading ? 'Thinking...' : 'Ask AI'}</button>
      </form>

      <div className="promptChips">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button className="chipButton" type="button" key={prompt} onClick={() => askAssistant(undefined, prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="aiResult">
          <p>{result.answer}</p>
          <div className="intentGrid">
            <span><strong>Category:</strong> {result.extractedIntent.category ?? 'Any'}</span>
            <span><strong>Budget:</strong> {result.extractedIntent.maxPriceCents ? money(result.extractedIntent.maxPriceCents) : 'Flexible'}</span>
            <span><strong>Keywords:</strong> {result.extractedIntent.keywords.slice(0, 5).join(', ') || 'Popular'}</span>
          </div>

          <div className="aiRecommendations">
            {result.recommendations.slice(0, 3).map((product) => (
              <Link to={`/products/${product.id}`} className="aiRecommendation" key={product.id}>
                <img src={product.image_url ?? ''} alt={product.name} />
                <div>
                  <strong>{product.name}</strong>
                  <span>{money(product.price_cents)} · score {product.match_score}</span>
                  <small>{product.match_reasons.slice(0, 2).join(' · ')}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
