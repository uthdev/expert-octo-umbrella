const Student = require('../../../managers/entities/student/Student.model');
const StudentManager = require('../../../managers/entities/student/Student.manager');
const School = require('../../../managers/entities/school/School.model');
const Classroom = require('../../../managers/entities/classroom/Classroom.model');
const roles = require('../../../constants/roles');

// Mock the models
jest.mock('../../../managers/entities/student/Student.model');
jest.mock('../../../managers/entities/school/School.model');
jest.mock('../../../managers/entities/classroom/Classroom.model');

describe('StudentManager', () => {
    let studentManager;
    let mockToken;
    let mockStudentInstance;

    beforeEach(() => {
        studentManager = new StudentManager({
            utils: {},
            cache: {},
            config: {},
            cortex: {},
            managers: { token: {} },
            validators: {}
        });

        mockToken = {
            role: roles.SCHOOL_ADMIN,
            userId: 'test-user-id',
            schoolId: 'test-school-id'
        };

        mockStudentInstance = {
            _id: 'student-id',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@test.com',
            phone: '1234567890',
            schoolId: 'test-school-id',
            classroomId: 'test-classroom-id',
            fullName: 'John Doe',
            enrollmentDate: new Date(),
            status: 'enrolled',
            createdAt: new Date(),
            save: jest.fn().mockResolvedValue()
        };

        Student.mockImplementation(() => mockStudentInstance);

        jest.clearAllMocks();
    });

    describe('createStudent', () => {
        it('should create student successfully', async () => {
            const studentData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@test.com',
                phone: '1234567890',
                schoolId: '507f1f77bcf86cd799439011', // Valid ObjectId
                classroomId: '507f1f77bcf86cd799439012', // Valid ObjectId
                __shortToken: { ...mockToken, schoolId: '507f1f77bcf86cd799439011' }
            };

            const mockSchool = { _id: '507f1f77bcf86cd799439011', name: 'Test School' };
            const mockClassroom = { 
                _id: '507f1f77bcf86cd799439012', 
                schoolId: '507f1f77bcf86cd799439011',
                capacity: 30,
                currentEnrollment: 20,
                save: jest.fn().mockResolvedValue()
            };

            School.findById.mockResolvedValue(mockSchool);
            Classroom.findById.mockResolvedValue(mockClassroom);
            Student.findOne.mockResolvedValue(null);

            const result = await studentManager.createStudent(studentData);

            expect(result.student).toBeDefined();
            expect(result.student.firstName).toBe(studentData.firstName);
            expect(mockClassroom.currentEnrollment).toBe(21);
        });

        it('should reject creation for classroom at capacity', async () => {
            const studentData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@test.com',
                schoolId: '507f1f77bcf86cd799439011', // Valid ObjectId
                classroomId: '507f1f77bcf86cd799439012', // Valid ObjectId
                __shortToken: { ...mockToken, schoolId: '507f1f77bcf86cd799439011' }
            };

            const mockSchool = { _id: '507f1f77bcf86cd799439011' };
            const mockClassroom = { 
                _id: '507f1f77bcf86cd799439012',
                schoolId: '507f1f77bcf86cd799439011',
                capacity: 30,
                currentEnrollment: 30
            };

            School.findById.mockResolvedValue(mockSchool);
            Classroom.findById.mockResolvedValue(mockClassroom);

            const result = await studentManager.createStudent(studentData);

            expect(result.error).toBe('Classroom is at full capacity');
            expect(result.code).toBe(400);
        });

        it('should reject duplicate email in same school', async () => {
            const studentData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'existing@test.com',
                schoolId: '507f1f77bcf86cd799439011', // Valid ObjectId
                __shortToken: { ...mockToken, schoolId: '507f1f77bcf86cd799439011' }
            };

            const mockSchool = { _id: '507f1f77bcf86cd799439011' };
            School.findById.mockResolvedValue(mockSchool);
            Student.findOne.mockResolvedValue({ email: 'existing@test.com' });

            const result = await studentManager.createStudent(studentData);

            expect(result.error).toBe('Student with this email already exists in the school');
            expect(result.code).toBe(400);
        });
    });

    describe('transferStudent', () => {
        it('should transfer student successfully', async () => {
            const mockStudent = {
                _id: 'student-id',
                firstName: 'John',
                lastName: 'Doe',
                schoolId: 'test-school-id',
                classroomId: 'old-classroom-id',
                fullName: 'John Doe',
                save: jest.fn().mockResolvedValue()
            };

            const mockOldClassroom = {
                _id: 'old-classroom-id',
                currentEnrollment: 20,
                save: jest.fn().mockResolvedValue()
            };

            const mockNewClassroom = {
                _id: 'new-classroom-id',
                schoolId: 'test-school-id',
                capacity: 30,
                currentEnrollment: 15,
                save: jest.fn().mockResolvedValue()
            };

            Student.findById.mockResolvedValue(mockStudent);
            Classroom.findById
                .mockResolvedValueOnce(mockNewClassroom)
                .mockResolvedValueOnce(mockOldClassroom);

            const result = await studentManager.transferStudent({
                id: 'student-id',
                newClassroomId: 'new-classroom-id',
                __shortToken: mockToken
            });

            expect(mockOldClassroom.currentEnrollment).toBe(19);
            expect(mockNewClassroom.currentEnrollment).toBe(16);
            expect(mockStudent.classroomId).toBe('new-classroom-id');
            expect(result.message).toBe('Student transferred successfully');
        });

        it('should reject transfer to same classroom', async () => {
            const mockStudent = {
                _id: 'student-id',
                schoolId: 'test-school-id',
                classroomId: 'same-classroom-id'
            };

            const mockClassroom = {
                _id: 'same-classroom-id',
                schoolId: 'test-school-id'
            };

            Student.findById.mockResolvedValue(mockStudent);
            Classroom.findById.mockResolvedValue(mockClassroom);

            const result = await studentManager.transferStudent({
                id: 'student-id',
                newClassroomId: 'same-classroom-id',
                __shortToken: mockToken
            });

            expect(result.error).toBe('Student is already in this classroom');
            expect(result.code).toBe(400);
        });

        it('should handle transfer for student with no current classroom', async () => {
            const mockStudent = {
                _id: 'student-id',
                schoolId: 'test-school-id',
                classroomId: null,
                save: jest.fn().mockResolvedValue()
            };

            const mockNewClassroom = {
                _id: 'new-classroom-id',
                schoolId: 'test-school-id',
                capacity: 30,
                currentEnrollment: 15,
                save: jest.fn().mockResolvedValue()
            };

            Student.findById.mockResolvedValue(mockStudent);
            Classroom.findById.mockResolvedValue(mockNewClassroom);

            const result = await studentManager.transferStudent({
                id: 'student-id',
                newClassroomId: 'new-classroom-id',
                __shortToken: mockToken
            });

            expect(mockNewClassroom.currentEnrollment).toBe(16);
            expect(mockStudent.classroomId).toBe('new-classroom-id');
            expect(result.message).toBe('Student transferred successfully');
        });
    });
});

// Mock models are already set up above