const campusRoutes = require('../../routes/campus.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('campus.routes integration', () => {
  const app = buildRouteApp('/campus', campusRoutes);
  const campusId = 'c123456789012345678901234';

  test.each([
    ['get', '/campus'],
    ['get', `/campus/${campusId}`],
    ['post', '/campus', { name: 'Main Campus', city: 'Cairo' }],
    ['patch', `/campus/${campusId}`, { city: 'Giza' }],
    ['delete', `/campus/${campusId}`],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
