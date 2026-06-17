const {
  paramsSchema,
  generateScheduleSchema,
  validate,
} = require('../../../validators/schedule.validator');

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

describe('schedule.validator', () => {
  describe('paramsSchema', () => {
    test('accepts a valid schedule id', () => {
      const { error } = paramsSchema.validate({ id: validCuid });

      expect(error).toBeUndefined();
    });

    test('rejects an invalid schedule id', () => {
      const { error } = paramsSchema.validate({ id: 'schedule-1' });

      expect(error.message).toBe('"id" must be a valid CUID');
    });
  });

  describe('generateScheduleSchema', () => {
    test('accepts valid schedule generation payload', () => {
      const { error } = generateScheduleSchema.validate({
        campusId: validCuid,
        semester: 'Fall 2026',
        scheduleType: 'all',
      });

      expect(error).toBeUndefined();
    });

    test('accepts payload without optional scheduleType', () => {
      const { error } = generateScheduleSchema.validate({
        campusId: validCuid,
        semester: 'Fall 2026',
      });

      expect(error).toBeUndefined();
    });

    test('rejects invalid campusId and scheduleType', () => {
      const { error } = generateScheduleSchema.validate(
        {
          campusId: 'bad-id',
          semester: 'Fall 2026',
          scheduleType: 'invalid',
        },
        { abortEarly: false }
      );

      expect(error.details.map(detail => detail.path[0])).toEqual(['campusId', 'scheduleType']);
    });

    test('requires semester', () => {
      const { error } = generateScheduleSchema.validate({ campusId: validCuid });

      expect(error.message).toBe('"semester" is required');
    });
  });

  describe('validate', () => {
    test('calls next when validation succeeds', () => {
      const req = {
        body: {
          campusId: validCuid,
          semester: 'Fall 2026',
          scheduleType: 'lectures',
        },
      };
      const res = mockResponse();
      const next = jest.fn();

      validate(generateScheduleSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('returns validation failure response when validation fails', () => {
      const req = {
        body: {
          campusId: 'bad-id',
          semester: '',
          scheduleType: 'invalid',
        },
      };
      const res = mockResponse();
      const next = jest.fn();

      validate(generateScheduleSchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: expect.stringContaining('"campusId" must be a valid CUID'),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
