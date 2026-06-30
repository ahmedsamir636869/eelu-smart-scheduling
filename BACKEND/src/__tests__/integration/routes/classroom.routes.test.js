const classroomRoutes = require('../../routes/classroom.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('classroom.routes integration', () => {
  const app = buildRouteApp('/classroom', classroomRoutes);
  const classroomId = 'c123456789012345678901234';

  test.each([
    ['get', '/classroom', { campusName: 'Main Campus' }],
    ['get', `/classroom/${classroomId}`],
    ['post', '/classroom', { name: 'A101', capacity: 40, type: 'LECTURE_HALL', campusName: 'Main Campus' }],
    ['patch', `/classroom/${classroomId}`, { capacity: 50 }],
    ['delete', `/classroom/${classroomId}`],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
