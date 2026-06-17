const importRoutes = require('../../routes/import.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('import.routes integration', () => {
  const app = buildRouteApp('/import', importRoutes);

  test.each([
    ['post', '/import/students'],
    ['post', '/import/physical'],
    ['post', '/import/instructors'],
    ['post', '/import/courses'],
    ['post', '/import/all'],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint] = row;
    await expectNoToken(app, method, endpoint);
  });
});
