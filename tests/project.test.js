require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

const testUser = {
  first_name: 'Project',
  last_name: 'Tester',
  username: 'projecttester_jest',
  email: 'projecttester_jest@example.com',
  password: 'testpass789',
};

let token;
let createdProjectId;

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE username = $1', [testUser.username]);
  await request(app).post('/api/auth/register').send(testUser);
  const loginRes = await request(app).post('/api/auth/login').send({
    username: testUser.username,
    password: testUser.password,
  });
  token = loginRes.body.token;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE username = $1', [testUser.username]);
  await pool.end();
});

describe('Projects CRUD', () => {
  it('rejects request with no token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toBe(401);
  });

  it('creates a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Jest Test Project' });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Jest Test Project');
    createdProjectId = res.body.project_id;
  });

  it('lists projects including the one just created', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const found = res.body.find((p) => p.project_id === createdProjectId);
    expect(found).toBeTruthy();
    expect(found.role).toBe('owner');
  });

  it('updates the project', async () => {
    const res = await request(app)
      .patch(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed Project' });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Renamed Project');
  });

  it('deletes the project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(204);
  });
});