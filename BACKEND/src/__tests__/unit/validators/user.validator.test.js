const {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  validate,
} = require('../../../validators/user.validator');

const validCuid = 'c123456789012345678901234';

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('user.validator', () => {
  describe('createUserSchema', () => {
    test('accepts valid user data', () => {
      const { error } = createUserSchema.validate({
        FirstName: 'Ahmed',
        LastName: 'Ali',
        Email: 'ahmed@test.com',
        Password: 'secret1',
        Role: 'ADMIN',
        employeeId: 'EMP123',
        isExpatriate: false,
      });

      expect(error).toBeUndefined();
    });

    test('returns custom messages for invalid user data', () => {
      const { error } = createUserSchema.validate(
        {
          FirstName: 'A',
          LastName: '',
          Email: 'bad-email',
          Password: '123',
          Role: 'STUDENT',
        },
        { abortEarly: false }
      );

      expect(error.details.map(detail => detail.message)).toEqual([
        'First name must be at least 2 characters long',
        'Last name is required',
        'Invalid email format',
        'Password must be at least 6 characters long',
        'Invalid role type. Must be ADMIN, INSTRUCTOR, or TA',
      ]);
    });
  });

  describe('updateUserSchema', () => {
    test('accepts optional update fields', () => {
      const { error } = updateUserSchema.validate({
        Email: 'new@test.com',
        isExpatriate: true,
      });

      expect(error).toBeUndefined();
    });

    test('rejects invalid update role', () => {
      const { error } = updateUserSchema.validate({ Role: 'STUDENT' });

      expect(error.message).toContain('must be one of');
    });
  });

  describe('userIdSchema', () => {
    test('accepts valid userId', () => {
      const { error } = userIdSchema.validate({ userId: validCuid });

      expect(error).toBeUndefined();
    });

    test('rejects invalid userId format', () => {
      const { error } = userIdSchema.validate({ userId: 'bad-id' });

      expect(error.message).toBe('Invalid user ID format');
    });
  });

  describe('validate', () => {
    test('defaults to validating request body and calls next on success', () => {
      const req = {
        body: {
          FirstName: 'Ahmed',
          LastName: 'Ali',
          Email: 'ahmed@test.com',
          Password: 'secret1',
          Role: 'TA',
        },
      };
      const res = mockResponse();
      const next = jest.fn();

      validate(createUserSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('returns validation error details on failure', () => {
      const req = {
        body: {
          FirstName: 'A',
          LastName: 'Ali',
          Email: 'bad-email',
          Password: '123',
          Role: 'TA',
        },
      };
      const res = mockResponse();
      const next = jest.fn();

      validate(createUserSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation Error',
        details: [
          'First name must be at least 2 characters long',
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('validates custom request property when provided', () => {
      const req = { params: { userId: validCuid } };
      const res = mockResponse();
      const next = jest.fn();

      validate(userIdSchema, 'params')(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
