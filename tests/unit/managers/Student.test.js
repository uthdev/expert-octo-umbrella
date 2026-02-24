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
                schoolId: 'test-school-id',
                classroomId: 'test-classroom-id',
                __shortToken: mockToken
            };

            const mockSchool = { _id: 'test-school-id', name: 'Test School' };
            const mockClassroom = { 
                _id: 'test-classroom-id', 
                schoolId: 'test-school-id',
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
                schoolId: 'test-school-id',
                classroomId: 'test-classroom-id',
                __shortToken: mockToken
            };

            const mockSchool = { _id: 'test-school-id' };
            const mockClassroom = { 
                _id: 'test-classroom-id',
                schoolId: 'test-school-id',
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
                schoolId: 'test-school-id',
                __shortToken: mockToken
            };

            const mockSchool = { _id: 'test-school-id' };
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
    });
});

// Mock models are already set up above