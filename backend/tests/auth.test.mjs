import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { connectDB } from '../config/db';

describe('Auth API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: `test_${Math.random()}@example.com`,
        password: 'password123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should fail registration with invalid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'te',
        email: 'invalid-email',
        password: '123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Validation Failed');
  });

  it('should fail login with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
  });
});
