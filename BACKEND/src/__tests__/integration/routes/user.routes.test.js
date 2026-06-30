const userRoutes = require('../../routes/user.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('user.routes integration', () => {
  const app = buildRouteApp('/user', userRoutes);
  const userId = 'c123456789012345678901234';

  test.each([
    ['get', '/user'],
    ['get', `/user/${userId}`],
    ['post', '/user', {
      FirstName: 'Ahmed',
      LastName: 'Ali',
      Email: 'ahmed@test.com',
      Password: 'secret123',
      Role: 'ADMIN',
    }],
    ['patch', `/user/${userId}`, { FirstName: 'Mohamed' }],
    ['delete', `/user/${userId}`],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
