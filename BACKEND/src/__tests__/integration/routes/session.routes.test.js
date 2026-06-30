const sessionRoutes = require('../../routes/session.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('session.routes integration', () => {
  const app = buildRouteApp('/session', sessionRoutes);
  const id = 'c123456789012345678901234';

  test.each([
    ['get', '/session'],
    ['get', `/session/${id}`],
    ['post', '/session', { name: 'Lecture 1', courseId: id, type: 'LECTURE' }],
    ['patch', `/session/${id}`, { type: 'SECTION' }],
    ['delete', `/session/${id}`],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
