const {
  validate,
  paramsForGetAllSchema,
  paramsForSingleCollegeSchema,
  createCollegeSchema,
  updateCollegeSchema,
} = require('../../../validators/college.validator');

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

describe('college.validator', () => {
  describe('createCollegeSchema', () => {
    test('accepts valid college data', () => {
      const { error } = createCollegeSchema.validate({ name: 'Computing', campusId: validCuid });

      expect(error).toBeUndefined();
    });

    test('rejects invalid campusId format', () => {
      const { error } = createCollegeSchema.validate({ name: 'Computing', campusId: 'bad-id' });

      expect(error.message).toBe('"campusId" must be a valid CUID');
    });
  });

  describe('updateCollegeSchema', () => {
    test('accepts partial update fields', () => {
      const { error } = updateCollegeSchema.validate({ name: 'Engineering' });

      expect(error).toBeUndefined();
    });

    test('rejects empty update payload', () => {
      const { error } = updateCollegeSchema.validate({});

      expect(error.message).toContain('must have at least 1 key');
    });
  });

  describe('params schemas', () => {
    test('accept campusId for get-all params', () => {
      const { error } = paramsForGetAllSchema.validate({ campusId: validCuid });

      expect(error).toBeUndefined();
    });

    test('accept collegeId for single-college params', () => {
      const { error } = paramsForSingleCollegeSchema.validate({ collegeId: validCuid });

      expect(error).toBeUndefined();
    });
  });

  describe('validate', () => {
    test('calls next for valid data', () => {
      const req = { body: { name: 'Computing', campusId: validCuid } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createCollegeSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('returns validation failure response for invalid data', () => {
      const req = { body: { name: 'A', campusId: 'bad-id' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createCollegeSchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: expect.stringContaining('"campusId" must be a valid CUID'),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
