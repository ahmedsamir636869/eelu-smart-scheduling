const {
  createInstructorSchema,
  updateInstructorSchema,
  submitAvailabilitySchema,
  reviewAvailabilitySchema,
  paramsSchema,
  availabilityParamsSchema,
  validate,
} = require('../../../validators/instructor.validator');

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

describe('instructor.validator', () => {
  describe('createInstructorSchema', () => {
    test('accepts valid instructor data', () => {
      const { error } = createInstructorSchema.validate({
        name: 'Dr Ahmed',
        email: 'ahmed@test.com',
        departmentId: validCuid,
        employmentType: 'PART_TIME',
      });

      expect(error).toBeUndefined();
    });

    test('rejects invalid employment type and departmentId', () => {
      const { error } = createInstructorSchema.validate(
        {
          name: 'Dr Ahmed',
          email: 'ahmed@test.com',
          departmentId: 'bad-id',
          employmentType: 'CONTRACTOR',
        },
        { abortEarly: false }
      );

      expect(error.details.map(detail => detail.path[0])).toEqual(['departmentId', 'employmentType']);
    });
  });

  describe('updateInstructorSchema', () => {
    test('accepts partial update fields', () => {
      const { error } = updateInstructorSchema.validate({ employmentType: 'FULL_TIME' });

      expect(error).toBeUndefined();
    });

    test('rejects empty update payload', () => {
      const { error } = updateInstructorSchema.validate({});

      expect(error.message).toContain('must have at least 1 key');
    });
  });

  describe('submitAvailabilitySchema', () => {
    test('accepts valid availability slots', () => {
      const { error } = submitAvailabilitySchema.validate({
        slots: [
          {
            day: 'MONDAY',
            startTime: '2026-06-17T08:00:00.000Z',
            endTime: '2026-06-17T10:00:00.000Z',
          },
        ],
      });

      expect(error).toBeUndefined();
    });

    test('rejects empty slots array', () => {
      const { error } = submitAvailabilitySchema.validate({ slots: [] });

      expect(error.message).toContain('must contain at least 1 items');
    });
  });

  describe('reviewAvailabilitySchema', () => {
    test('accepts approved or rejected status', () => {
      expect(reviewAvailabilitySchema.validate({ status: 'APPROVED' }).error).toBeUndefined();
      expect(reviewAvailabilitySchema.validate({ status: 'REJECTED' }).error).toBeUndefined();
    });

    test('rejects unknown status', () => {
      const { error } = reviewAvailabilitySchema.validate({ status: 'PENDING' });

      expect(error.message).toContain('must be one of');
    });
  });

  describe('params schemas', () => {
    test('accept valid instructor and availability ids', () => {
      expect(paramsSchema.validate({ instructorId: validCuid }).error).toBeUndefined();
      expect(availabilityParamsSchema.validate({ availabilityId: validCuid }).error).toBeUndefined();
    });
  });

  describe('validate', () => {
    test('calls next when validation succeeds', () => {
      const req = { body: { status: 'APPROVED' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(reviewAvailabilitySchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('returns validation failure response when validation fails', () => {
      const req = { body: { status: 'PENDING' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(reviewAvailabilitySchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: expect.stringContaining('"status" must be one of'),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
