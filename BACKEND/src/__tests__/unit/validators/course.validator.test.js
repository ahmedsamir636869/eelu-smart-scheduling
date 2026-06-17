const {
  createCourseSchema,
  updateCourseSchema,
  paramsSchema,
  validate,
} = require('../../../validators/course.validator');

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

describe('course.validator', () => {
  const validCourse = {
    name: 'Algorithms',
    code: 'CS201',
    days: 2,
    hoursPerDay: 2,
    year: 2,
    type: 'THEORETICAL',
    departmentId: validCuid,
    collegeId: validCuid,
    instructorId: null,
  };

  describe('createCourseSchema', () => {
    test('accepts valid course data with null instructorId', () => {
      const { error } = createCourseSchema.validate(validCourse);

      expect(error).toBeUndefined();
    });

    test('rejects invalid days, year, and type', () => {
      const { error } = createCourseSchema.validate(
        { ...validCourse, days: 8, year: 5, type: 'LECTURE' },
        { abortEarly: false }
      );

      expect(error.details.map(detail => detail.path[0])).toEqual(['days', 'year', 'type']);
    });
  });

  describe('updateCourseSchema', () => {
    test('accepts partial update data', () => {
      const { error } = updateCourseSchema.validate({ instructorId: null });

      expect(error).toBeUndefined();
    });

    test('rejects empty update payload', () => {
      const { error } = updateCourseSchema.validate({});

      expect(error.message).toContain('must have at least 1 key');
    });
  });

  describe('paramsSchema', () => {
    test('accepts valid courseId', () => {
      const { error } = paramsSchema.validate({ courseId: validCuid });

      expect(error).toBeUndefined();
    });

    test('rejects invalid courseId', () => {
      const { error } = paramsSchema.validate({ courseId: 'bad-id' });

      expect(error.message).toBe('"courseId" must be a valid CUID');
    });
  });

  describe('validate', () => {
    test('calls next when validation succeeds', () => {
      const req = { body: validCourse };
      const res = mockResponse();
      const next = jest.fn();

      validate(createCourseSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('returns validation failure response without details field', () => {
      const req = { body: { ...validCourse, days: 0 } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createCourseSchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
