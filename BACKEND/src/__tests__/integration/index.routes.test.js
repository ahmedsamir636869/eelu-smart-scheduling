const indexRoutes = require('../../routes/index.routes');
const { buildRouteApp, expectNoToken, request } = require('../../test-utils/routeTestUtils');

describe('index.routes integration', () => {
  const app = buildRouteApp('/api/v1', indexRoutes);

  test('mounts public auth routes', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .expect(200);

    expect(response.body).toEqual({ message: 'Logged out successfully' });
  });

  test('mounts protected campus routes', async () => {
    await expectNoToken(app, 'get', '/api/v1/campus');
  });

  test('mounts public OTP routes', async () => {
    const response = await request(app)
      .post('/api/v1/otp/verify-otp')
      .send({ otp: '000000' })
      .expect(400);

    expect(response.body).toEqual({
      message: 'Invalid OTP. Please check the code and try again.',
    });
  });
});
