const collegeRoutes = require('../../routes/college.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('college.routes integration', () => {
  const app = buildRouteApp('/college', collegeRoutes);
  const id = 'c123456789012345678901234';

  test.each([
    ['get', `/college/${id}`],
    ['post', '/college', { name: 'Computing', campusId: id }],
    ['patch', `/college/${id}`, { name: 'Engineering' }],
    ['delete', `/college/${id}`],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
