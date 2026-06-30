const studentGroupRoutes = require('../../routes/studentGroup.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('studentGroup.routes integration', () => {
  const app = buildRouteApp('/studentGroup', studentGroupRoutes);
  const id = 'c123456789012345678901234';

  test.each([
    ['get', '/studentGroup'],
    ['get', `/studentGroup/${id}`],
    ['post', '/studentGroup', { name: 'G1', year: 2, studentCount: 35, departmentId: id }],
    ['patch', `/studentGroup/${id}`, { studentCount: 40 }],
    ['delete', `/studentGroup/${id}`],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
