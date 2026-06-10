import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { connectDB, getModels } from '../config/db';

describe('Product API', () => {
  let token;
  let productId;

  beforeAll(async () => {
    await connectDB();
    
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@smartstock.com',
        password: 'password123'
      });
    token = loginRes.body.token;
  });

  it('should create a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Gadget',
        sku: `TG-${Math.random().toString(36).substring(7)}`,
        price: 99.99,
        quantity: 50,
        minLimit: 10,
        category: 'Gadgets'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Gadget');
    productId = res.body._id;
  });

  it('should get all products', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('should adjust stock', async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/adjust-stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.quantity).toBe(45);
  });

  it('should fail adjustment if stock insufficient', async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/adjust-stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -100 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Insufficient stock. Quantity cannot go below 0');
  });

  it('should import products from CSV', async () => {
    const res = await request(app)
      .post('/api/products/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', 'test_import.csv');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Import complete');
  });
});
