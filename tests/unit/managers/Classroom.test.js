const Classroom = require('../../../managers/entities/classroom/Classroom.model');
const ClassroomManager = require('../../../managers/entities/classroom/Classroom.manager');
const School = require('../../../managers/entities/school/School.model');
const roles = require('../../../constants/roles');

// Mock the models
jest.mock('../../../managers/entities/classroom/Classroom.model');
jest.mock('../../../managers/entities/school/School.model');

describe('ClassroomManager', () => {
    let classroomManager;
    let mockToken;
    let mockClassroomInstance;

    beforeEach(() => {
        classroomManager = new ClassroomManager({
            utils: {},
            cache: {},
            config: {},
            cortex: {},
            managers: { token: {} },
            validators: {}
        });

        mockToken = {
            role: roles.SUPERADMIN,
            userId: 'test-user-id',
            schoolId: 'test-school-id'
        };

        mockClassroomInstance = {
            _id: 'classroom-id',
            name: 'Test Classroom',
            capacity: 30,
            schoolId: 'test-school-id',
            resources: ['projector'],
            currentEnrollment: 0,
            save: jest.fn().mockResolvedValue()
        };

        Classroom.mockImplementation(() => mockClassroomInstance);

        jest.clearAllMocks();
    });

    describe('createClassroom', () => {
        it('should create classroom successfully for superadmin', async () => {
            const classroomData = {
                name: 'Test Classroom',
                capacity: 30,
                schoolId: 'test-school-id',
                resources: ['projector', 'whiteboard'],
                __shortToken: mockToken
            };

            const mockSchool = { _id: 'test-school-id', name: 'Test School' };
            School.findById.mockResolvedValue(mockSchool);

            const result = await classroomManager.createClassroom(classroomData);

            expect(School.findById).toHaveBeenCalledWith(classroomData.schoolId);
            expect(mockClassroomInstance.save).toHaveBeenCalled();
            expect(result.classroom).toBeDefined();
            expect(result.classroom.name).toBe(classroomData.name);
        });

        it('should reject creation for school admin accessing different school', async () => {
            const classroomData = {
                name: 'Test Classroom',
                capacity: 30,
                schoolId: 'different-school-id',
                __shortToken: { ...mockToken, role: roles.SCHOOL_ADMIN }
            };

            const result = await classroomManager.createClassroom(classroomData);

            expect(result.error).toBe('You can only create classrooms for your school');
            expect(result.code).toBe(403);
        });

        it('should reject creation for non-existent school', async () => {
            const classroomData = {
                name: 'Test Classroom',
                capacity: 30,
                schoolId: 'non-existent-school',
                __shortToken: mockToken
            };

            School.findById.mockResolvedValue(null);

            const result = await classroomManager.createClassroom(classroomData);

            expect(result.error).toBe('School not found');
            expect(result.code).toBe(404);
        });
    });

    describe('updateClassroom', () => {
        it('should update classroom capacity successfully', async () => {
            const mockClassroom = {
                _id: 'classroom-id',
                name: 'Test Classroom',
                capacity: 30,
                currentEnrollment: 20,
                schoolId: 'test-school-id',
                save: jest.fn().mockResolvedValue()
            };

            Classroom.findById.mockResolvedValue(mockClassroom);

            const result = await classroomManager.updateClassroom({
                id: 'classroom-id',
                capacity: 35,
                __shortToken: mockToken
            });

            expect(mockClassroom.capacity).toBe(35);
            expect(mockClassroom.save).toHaveBeenCalled();
            expect(result.classroom.capacity).toBe(35);
        });

        it('should reject capacity reduction below current enrollment', async () => {
            const mockClassroom = {
                _id: 'classroom-id',
                capacity: 30,
                currentEnrollment: 25,
                schoolId: 'test-school-id'
            };

            Classroom.findById.mockResolvedValue(mockClassroom);

            const result = await classroomManager.updateClassroom({
                id: 'classroom-id',
                capacity: 20,
                __shortToken: mockToken
            });

            expect(result.error).toContain('Cannot reduce capacity below current enrollment');
            expect(result.code).toBe(400);
        });
    });
});

// Mock models are already set up above