const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env.test'), override: true });

const express = require('express');
const request = require('supertest');
const otpRoutes = require('../../routes/otp.routes');
const { prisma } = require('../../config/db');

const buildApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/otp', otpRoutes);

  return app;
};

describe('otp.routes integration', () => {
  const app = buildApp();
  const missingEmail = `missing-otp-${Date.now()}@test.com`;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /otp/forgot-password', () => {
    test('returns 400 when the email is not registered', async () => {
      const response = await request(app)
        .post('/otp/forgot-password')
        .send({ email: missingEmail })
        .expect(400);

      expect(response.body).toEqual({ message: 'User not found' });
    });
  });

  describe('POST /otp/verify-otp', () => {
    test('returns 400 for an invalid OTP', async () => {
      const response = await request(app)
        .post('/otp/verify-otp')
        .send({ otp: '000000' })
        .expect(400);

      expect(response.body).toEqual({
        message: 'Invalid OTP. Please check the code and try again.',
      });
    });
  });

  describe('POST /otp/reset-password', () => {
    test('returns 400 for an invalid OTP', async () => {
      const response = await request(app)
        .post('/otp/reset-password')
        .send({ otp: '000000', newPassword: 'secret123' })
        .expect(400);

      expect(response.body).toEqual({
        message: 'Invalid OTP. Please check the code and try again.',
      });
    });
  });

  describe('POST /otp/resend-otp', () => {
    test('returns 400 when the email is not registered', async () => {
      const response = await request(app)
        .post('/otp/resend-otp')
        .send({ email: missingEmail })
        .expect(400);

      expect(response.body).toEqual({ message: 'User not found' });
    });
  });
});
