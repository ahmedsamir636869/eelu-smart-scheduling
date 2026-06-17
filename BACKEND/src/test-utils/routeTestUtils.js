const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');

require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env.test'), override: true, quiet: true });

const { prisma } = require('../config/db');

afterAll(async () => {
  await prisma.$disconnect();
});

const buildRouteApp = (basePath, router) => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(basePath, router);

  return app;
};

const expectNoToken = async (app, method, endpoint, body) => {
  const testRequest = request(app)[method](endpoint);
  const response = body === undefined
    ? await testRequest
    : await testRequest.send(body);

  expect(response.status).toBe(401);
  expect(response.body).toEqual({
    message: 'No token provided, authorization denied',
  });
};

module.exports = {
  buildRouteApp,
  expectNoToken,
  request,
};
