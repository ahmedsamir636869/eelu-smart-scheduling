const {
  createStudentGroupSchema,
  updateStudentGroupSchema,
  paramsSchema,
  validate,
} = require('../../../validators/studentGroup.validator');

const validCuid = 'c123456789012345678901234';

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('studentGroup.validator', () => {
  describe('createStudentGroupSchema', () => {
    test('accepts valid student group data', () => {
      const { error } = createStudentGroupSchema.validate({
        name: 'G1',
        year: 2,
        studentCount: 35,
        departmentId: validCuid,
      });

      expect(error).toBeUndefined();
    });

    test('rejects invalid departmentId', () => {
      const { error } = createStudentGroupSchema.validate({
        name: 'G1',
        year: 2,
        studentCount: 35,
        departmentId: 'bad-id',
      });

      expect(error.message).toBe('"departmentId" must be a valid CUID');
    });
  });

  describe('updateStudentGroupSchema', () => {
    test('accepts partial update data', () => {
      const { error } = updateStudentGroupSchema.validate({ studentCount: 40 });

      expect(error).toBeUndefined();
    });
  });

  describe('paramsSchema', () => {
    test('accepts valid studentGroupId', () => {
      const { error } = paramsSchema.validate({ studentGroupId: validCuid });

      expect(error).toBeUndefined();
    });
  });

  describe('validate', () => {
    test('calls next when validation succeeds', () => {
      const req = { body: { name: 'G1', year: 2, studentCount: 35, departmentId: validCuid } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createStudentGroupSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('returns validation failure response when validation fails', () => {
      const req = { body: { name: 'G1', year: 2, studentCount: 35, departmentId: 'bad-id' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createStudentGroupSchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: '"departmentId" must be a valid CUID',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
