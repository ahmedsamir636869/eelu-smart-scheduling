const courseRoutes = require('../../routes/course.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('course.routes integration', () => {
  const app = buildRouteApp('/course', courseRoutes);
  const id = 'c123456789012345678901234';

  test.each([
    ['get', '/course'],
    ['get', `/course/${id}`],
    ['post', '/course', {
      name: 'Algorithms',
      code: 'CS201',
      days: 2,
      hoursPerDay: 2,
      year: 2,
      type: 'THEORETICAL',
      departmentId: id,
      collegeId: id,
    }],
    ['patch', `/course/${id}`, { name: 'Advanced Algorithms' }],
    ['delete', `/course/${id}`],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
