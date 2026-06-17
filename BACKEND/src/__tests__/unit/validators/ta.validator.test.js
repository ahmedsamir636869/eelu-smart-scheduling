const {
  createTASchema,
  updateTASchema,
  submitReportSchema,
  setOffDaysSchema,
  taParamsSchema,
  reportParamsSchema,
  validate,
} = require('../../../validators/ta.validator');

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

describe('ta.validator', () => {
  describe('createTASchema', () => {
    test('accepts valid TA data', () => {
      const { error } = createTASchema.validate({
        name: 'Ahmed',
        email: 'ahmed@test.com',
        departmentId: validCuid,
        isExpatriate: false,
      });

      expect(error).toBeUndefined();
    });

    test('rejects invalid email and departmentId', () => {
      const { error } = createTASchema.validate(
        { name: 'Ahmed', email: 'bad-email', departmentId: 'bad-id' },
        { abortEarly: false }
      );

      expect(error.details.map(detail => detail.path[0])).toEqual(['email', 'departmentId']);
    });
  });

  describe('updateTASchema', () => {
    test('accepts isExpatriate false as an update', () => {
      const { error } = updateTASchema.validate({ isExpatriate: false });

      expect(error).toBeUndefined();
    });

    test('rejects empty update payload', () => {
      const { error } = updateTASchema.validate({});

      expect(error.message).toContain('must have at least 1 key');
    });
  });

  describe('setOffDaysSchema', () => {
    test('accepts unique valid days', () => {
      const { error } = setOffDaysSchema.validate({ days: ['MONDAY', 'TUESDAY'] });

      expect(error).toBeUndefined();
    });

    test('rejects duplicate days', () => {
      const { error } = setOffDaysSchema.validate({ days: ['MONDAY', 'MONDAY'] });

      expect(error.message).toContain('contains a duplicate value');
    });
  });

  describe('submitReportSchema', () => {
    test('accepts valid report payload', () => {
      const { error } = submitReportSchema.validate({
        title: 'Weekly Update',
        content: 'This week had enough useful report content.',
      });

      expect(error).toBeUndefined();
    });

    test('rejects too-short title and content', () => {
      const { error } = submitReportSchema.validate({ title: 'Hi', content: 'short' }, { abortEarly: false });

      expect(error.details.map(detail => detail.path[0])).toEqual(['title', 'content']);
    });
  });

  describe('params schemas', () => {
    test('accept valid TA and report ids', () => {
      expect(taParamsSchema.validate({ taId: validCuid }).error).toBeUndefined();
      expect(reportParamsSchema.validate({ reportId: validCuid }).error).toBeUndefined();
    });
  });

  describe('validate', () => {
    test('calls next for valid data', () => {
      const req = { body: { days: ['MONDAY'] } };
      const res = mockResponse();
      const next = jest.fn();

      validate(setOffDaysSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('returns validation failure response for invalid data', () => {
      const req = { body: { days: ['FRIDAY'] } };
      const res = mockResponse();
      const next = jest.fn();

      validate(setOffDaysSchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: expect.stringContaining('"days[0]" must be one of'),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
