require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

const testUser = {
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser_jest',
  email: 'testuser_jest@example.com',
  password: 'testpass789',
};

// Clean up any leftover test user before and after running
beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE username = $1', [testUser.username]);
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE username = $1', [testUser.username]);
  await pool.end();
});

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user_id');
    expect(res.body.username).toBe(testUser.username);
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('rejects duplicate username', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'incomplete' });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: testUser.username,
      password: testUser.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: testUser.username,
      password: 'wrongpassword',
    });

    expect(res.statusCode).toBe(401);
  });

  it('rejects unknown username', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'doesnotexist',
      password: 'whatever',
    });

    expect(res.statusCode).toBe(401);
  });
});