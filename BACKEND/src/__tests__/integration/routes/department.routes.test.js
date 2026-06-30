const departmentRoutes = require('../../routes/department.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('department.routes integration', () => {
  const app = buildRouteApp('/department', departmentRoutes);
  const id = 'c123456789012345678901234';

  test.each([
    ['get', `/department/collegeId/${id}`],
    ['get', `/department/${id}`],
    ['post', '/department', { name: 'Computer Science', code: 'CS', collegeId: id }],
    ['patch', `/department/${id}`, { name: 'Software Engineering' }],
    ['delete', `/department/${id}`],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
