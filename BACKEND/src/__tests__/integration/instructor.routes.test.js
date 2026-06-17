const instructorRoutes = require('../../routes/instructor.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('instructor.routes integration', () => {
  const app = buildRouteApp('/instructor', instructorRoutes);
  const id = 'c123456789012345678901234';

  test.each([
    ['get', '/instructor'],
    ['get', `/instructor/${id}`],
    ['post', '/instructor', {
      name: 'Dr Ahmed',
      email: 'ahmed@test.com',
      departmentId: id,
      employmentType: 'PART_TIME',
    }],
    ['put', `/instructor/${id}`, { employmentType: 'FULL_TIME' }],
    ['delete', `/instructor/${id}`],
    ['post', '/instructor/availability', {
      slots: [{ day: 'MONDAY', startTime: '2026-06-17T08:00:00.000Z', endTime: '2026-06-17T10:00:00.000Z' }],
    }],
    ['get', '/instructor/availability/me'],
    ['patch', `/instructor/availability/${id}/review`, { status: 'APPROVED' }],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
