const {
  validate,
  createClassroomSchema,
  getAllClassroomsSchema,
  updateClassroomSchema,
  classroomIdParamSchema,
} = require('../../../validators/classroom.validator');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('classroom.validator', () => {
  describe('createClassroomSchema', () => {
    test('accepts valid classroom data', () => {
      const { error } = createClassroomSchema.validate({
        name: 'A101',
        capacity: 40,
        type: 'LECTURE_HALL',
        campusName: 'Main Campus',
      });

      expect(error).toBeUndefined();
    });

    test('returns custom messages for invalid classroom data', () => {
      const { error } = createClassroomSchema.validate(
        { name: '', capacity: 0, type: 'ROOM', campusName: '' },
        { abortEarly: false }
      );

      expect(error.details.map(detail => detail.message)).toEqual([
        'Classroom name is required',
        'Capacity must be at least 1',
        'Type must be one of: LECTURE_HALL, LAB',
        'Campus name is required',
      ]);
    });
  });

  describe('getAllClassroomsSchema', () => {
    test('requires campusName', () => {
      const { error } = getAllClassroomsSchema.validate({ campusName: '' });

      expect(error.message).toBe('Campus name is required to fetch classrooms');
    });
  });

  describe('updateClassroomSchema', () => {
    test('accepts partial update fields', () => {
      const { error } = updateClassroomSchema.validate({ capacity: 60 });

      expect(error).toBeUndefined();
    });

    test('rejects empty update payload', () => {
      const { error } = updateClassroomSchema.validate({});

      expect(error.message).toContain('must have at least 1 key');
    });
  });

  describe('classroomIdParamSchema', () => {
    test('requires classroomId', () => {
      const { error } = classroomIdParamSchema.validate({ classroomId: '' });

      expect(error.message).toBe('Classroom ID is required');
    });
  });

  describe('validate', () => {
    test('calls next for valid data', () => {
      const req = { body: { name: 'A101', capacity: 40, type: 'LAB', campusName: 'Main' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createClassroomSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('returns validation errors array for invalid data', () => {
      const req = { body: { name: '', capacity: 0, type: 'ROOM', campusName: '' } };
      const res = mockResponse();
      const next = jest.fn();

      validate(createClassroomSchema, 'body')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: [
          'Classroom name is required',
          'Capacity must be at least 1',
          'Type must be one of: LECTURE_HALL, LAB',
          'Campus name is required',
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
