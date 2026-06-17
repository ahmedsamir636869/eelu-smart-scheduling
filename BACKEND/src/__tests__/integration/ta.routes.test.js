const taRoutes = require('../../routes/ta.routes');
const { buildRouteApp, expectNoToken } = require('../../test-utils/routeTestUtils');

describe('ta.routes integration', () => {
  const app = buildRouteApp('/ta', taRoutes);
  const id = 'c123456789012345678901234';

  test.each([
    ['get', '/ta'],
    ['get', `/ta/${id}`],
    ['post', '/ta', { name: 'Ahmed', email: 'ta@test.com', departmentId: id, isExpatriate: false }],
    ['put', `/ta/${id}`, { isExpatriate: true }],
    ['delete', `/ta/${id}`],
    ['put', `/ta/${id}/off-days`, { days: ['MONDAY'] }],
    ['get', `/ta/${id}/off-days`],
    ['post', '/ta/reports', { title: 'Weekly Update', content: 'This is a long enough report content.' }],
    ['get', '/ta/reports/me'],
    ['get', '/ta/reports'],
    ['patch', `/ta/reports/${id}/read`],
  ])('%s %s returns 401 without a token', async (...row) => {
    const [method, endpoint, body] = row;
    await expectNoToken(app, method, endpoint, body);
  });
});
