import request from 'supertest';
import { app } from '../src/app';

describe('health route', () => {
  it('returns API health', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', service: 'cartzone-api' });
  });
});
