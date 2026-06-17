const {
  validate,
  createDepartmentSchema,
  updateDepartmentSchema,
  paramsForGetAllSchema,
  paramsForSingleDepartmentSchema,
} = require('../../../validators/department.validator');

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

describe('department.validator', () => {
  describe('createDepartmentSchema', () => {
    test('accepts valid department data and uppercases code', () => {
      const { error, value } = createDepartmentSchema.validate({
        name: 'Computer Science',
        code: 'cs',
        collegeId: validCuid,
      });

      expect(error).toBeUndefined();
      expect(value.code).toBe('CS');
    });

    test('rejects invalid collegeId', () => {
      const { error } = createDepartmentSchema.validate({
        name: 'Computer Science',
        code: 'CS',
        collegeId: 'bad-id',
      });

      expect(error.message).toBe('"collegeId" must be a valid CUID');
    });
  });

  describe('updateDepartmentSchema', () => {
    test('accepts partial updates', () => {
      const { error, value } = updateDepartmentSchema.validate({ code: 'se' });

      expect(error).toBeUndefined();
      expect(value.code).toBe('SE');
    });

    test('rejects empty update payload', () => {
      const { error } = updateDepartmentSchema.validate({});

      expect(error.message).toContain('must have at least 1 key');
    });
  });

  describe('params schemas', () => {
    test('accepts collegeId for get-all params', () => {
      const { error } = paramsForGetAllSchema.validate({ collegeId: validCuid });

      expect(error).toBeUndefined();
    });

    test('accepts departmentId for single department params', () => {
      const { error } = paramsForSingleDepartmentSchema.validate({ departmentId: validCuid });

      expect(error).toBeUndefined();
    });
  });

  describe('validate', () => {
    test('calls next for valid data', () => {
      const req = { body: { name: 'Computer Science', code: 'CS', collegeId: validCuid } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createDepartmentSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('returns 400 for invalid data', () => {
      const req = { body: { name: 'C', code: 'C', collegeId: 'bad-id' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createDepartmentSchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: expect.stringContaining('"collegeId" must be a valid CUID'),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
