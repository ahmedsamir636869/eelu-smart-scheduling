const {
  validate,
  paramsSchema,
  createCampusSchema,
  updateCampusSchema,
} = require('../../../validators/campus.validator');

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

describe('campus.validator', () => {
  describe('createCampusSchema', () => {
    test('accepts valid campus data and defaults colleges to an empty array', () => {
      const { error, value } = createCampusSchema.validate({ name: 'Main Campus', city: 'Cairo' });

      expect(error).toBeUndefined();
      expect(value).toEqual({ name: 'Main Campus', city: 'Cairo', colleges: [] });
    });

    test('rejects short name and city values', () => {
      const { error } = createCampusSchema.validate({ name: 'AB', city: 'NY' }, { abortEarly: false });

      expect(error.details.map(detail => detail.path[0])).toEqual(['name', 'city']);
    });
  });

  describe('updateCampusSchema', () => {
    test('accepts at least one updatable field', () => {
      const { error } = updateCampusSchema.validate({ city: 'Giza' });

      expect(error).toBeUndefined();
    });

    test('rejects empty update payload', () => {
      const { error } = updateCampusSchema.validate({});

      expect(error.message).toContain('must have at least 1 key');
    });
  });

  describe('paramsSchema', () => {
    test('accepts valid CUID campusId', () => {
      const { error } = paramsSchema.validate({ campusId: validCuid });

      expect(error).toBeUndefined();
    });

    test('rejects invalid campusId format', () => {
      const { error } = paramsSchema.validate({ campusId: 'bad-id' });

      expect(error.message).toBe('"campusId" must be a valid CUID');
    });
  });

  describe('validate', () => {
    test('calls next when request property is valid', () => {
      const req = { body: { name: 'Main Campus', city: 'Cairo' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createCampusSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('returns 400 response when request property is invalid', () => {
      const req = { body: { name: 'AB', city: 'NY' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createCampusSchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: expect.stringContaining('"name" length must be at least 3 characters long'),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
