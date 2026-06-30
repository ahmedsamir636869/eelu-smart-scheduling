const scheduleRoutes = require('../../routes/schedule.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('schedule.routes integration', () => {
  const app = buildRouteApp('/schedule', scheduleRoutes);
  const id = 'c123456789012345678901234';

  test.each([
    ['get', '/schedule'],
    ['get', `/schedule/${id}`],
    ['post', '/schedule/generate', { campusId: id, semester: 'Fall 2026', scheduleType: 'all' }],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
