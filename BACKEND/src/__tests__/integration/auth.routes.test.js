const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env.test'), override: true });

const express = require('express');
const request = require('supertest');
const { prisma } = require('../../config/db');
const { hashPassword } = require('../../utils/hash');
const authRoutes = require('../../routes/auth.routes');

const buildApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/auth', authRoutes);

  return app;
};

describe('auth.routes integration', () => {
  const app = buildApp();
  const testEmail = `integration-auth-${Date.now()}@test.com`;
  const password = 'secret123';

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });

    await prisma.user.create({
      data: {
        name: 'Integration Test User',
        email: testEmail,
        password: await hashPassword(password),
        roles: ['ADMIN'],
        emailVerified: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  describe('POST /auth/login', () => {
    test('returns an access token and user payload for valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testEmail, password })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
        user: {
          id: expect.any(String),
          email: testEmail,
          roles: ['ADMIN'],
          isExpatriate: null,
          instructor: null,
          ta: null,
        },
      });
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('refreshToken=')])
      );
    });

    test('returns 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testEmail, password: 'wrong-password' })
        .expect(401);

      expect(response.body).toEqual({
        message: 'Invalid credentials or email not verified',
      });
    });
  });
});
