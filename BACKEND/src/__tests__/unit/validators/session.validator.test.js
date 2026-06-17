const {
  createSessionSchema,
  updateSessionSchema,
  paramsSchema,
  validate,
} = require('../../../validators/session.validator');

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

describe('session.validator', () => {
  describe('createSessionSchema', () => {
    test('accepts valid session data', () => {
      const { error } = createSessionSchema.validate({
        name: 'Lecture 1',
        courseId: validCuid,
        type: 'LECTURE',
      });

      expect(error).toBeUndefined();
    });

    test('rejects invalid session type and courseId', () => {
      const { error } = createSessionSchema.validate(
        { name: 'L', courseId: 'bad-id', type: 'LAB' },
        { abortEarly: false }
      );

      expect(error.details.map(detail => detail.path[0])).toEqual(['name', 'courseId', 'type']);
    });
  });

  describe('updateSessionSchema', () => {
    test('accepts partial update fields', () => {
      const { error } = updateSessionSchema.validate({ type: 'SECTION' });

      expect(error).toBeUndefined();
    });

    test('rejects empty update payload', () => {
      const { error } = updateSessionSchema.validate({});

      expect(error.message).toContain('must have at least 1 key');
    });
  });

  describe('paramsSchema', () => {
    test('accepts valid sessionId', () => {
      const { error } = paramsSchema.validate({ sessionId: validCuid });

      expect(error).toBeUndefined();
    });

    test('rejects invalid sessionId', () => {
      const { error } = paramsSchema.validate({ sessionId: 'bad-id' });

      expect(error.message).toBe('"sessionId" must be a valid CUID');
    });
  });

  describe('validate', () => {
    test('calls next for valid data', () => {
      const req = { body: { name: 'Lecture 1', courseId: validCuid, type: 'LECTURE' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createSessionSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('returns 400 for invalid data', () => {
      const req = { body: { name: 'L', courseId: 'bad-id', type: 'LAB' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createSessionSchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: expect.stringContaining('"courseId" must be a valid CUID'),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
