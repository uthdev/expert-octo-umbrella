const School = require('../../../managers/entities/school/School.model');
const SchoolManager = require('../../../managers/entities/school/School.manager');
const roles = require('../../../constants/roles');

// Mock the School model
jest.mock('../../../managers/entities/school/School.model');

// Mock dependencies
const mockManagers = {
    token: {
        hasPermission: jest.fn()
    }
};

const mockConfig = {};
const mockCortex = {};
const mockValidators = {};
const mockUtils = {};
const mockCache = {};

describe('SchoolManager', () => {
    let schoolManager;
    let mockToken;
    let mockSchoolInstance;

    beforeEach(() => {
        schoolManager = new SchoolManager({
            utils: mockUtils,
            cache: mockCache,
            config: mockConfig,
            cortex: mockCortex,
            managers: mockManagers,
            validators: mockValidators
        });

        mockToken = {
            role: roles.SUPERADMIN,
            userId: 'test-user-id',
            schoolId: null
        };

        // Create mock instance
        mockSchoolInstance = {
            _id: 'test-school-id',
            name: 'Test School',
            address: '123 Test St',
            phone: '1234567890',
            email: 'test@school.com',
            status: 'active',
            createdAt: new Date(),
            save: jest.fn().mockResolvedValue()
        };

        // Mock School constructor
        School.mockImplementation(() => mockSchoolInstance);

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('createSchool', () => {
        it('should create school successfully for superadmin', async () => {
            const schoolData = {
                name: 'Test School',
                address: '123 Test St',
                phone: '1234567890',
                email: 'test@school.com',
                __shortToken: mockToken
            };

            // Mock School.findOne to return null (no existing school)
            School.findOne.mockResolvedValue(null);
            
            const result = await schoolManager.createSchool(schoolData);

            expect(School.findOne).toHaveBeenCalledWith({ email: schoolData.email });
            expect(mockSchoolInstance.save).toHaveBeenCalled();
            expect(result.school).toBeDefined();
            expect(result.school.name).toBe(schoolData.name);
        });

        it('should reject creation for non-superadmin', async () => {
            const schoolData = {
                name: 'Test School',
                address: '123 Test St',
                phone: '1234567890',
                email: 'test@school.com',
                __shortToken: { ...mockToken, role: roles.SCHOOL_ADMIN }
            };

            const result = await schoolManager.createSchool(schoolData);

            expect(result.error).toBe('Only superadmins can create schools');
            expect(result.code).toBe(403);
        });

        it('should reject duplicate email', async () => {
            const schoolData = {
                name: 'Test School',
                address: '123 Test St',
                phone: '1234567890',
                email: 'test@school.com',
                __shortToken: mockToken
            };

            // Mock existing school
            School.findOne.mockResolvedValue({ email: schoolData.email });

            const result = await schoolManager.createSchool(schoolData);

            expect(result.error).toBe('School with this email already exists');
            expect(result.code).toBe(400);
        });

        it('should handle database errors gracefully', async () => {
            const schoolData = {
                name: 'Test School',
                address: '123 Test St',
                phone: '1234567890',
                email: 'test@school.com',
                __shortToken: mockToken
            };

            School.findOne.mockRejectedValue(new Error('Database connection failed'));

            const result = await schoolManager.createSchool(schoolData);

            expect(result.error).toBe('Failed to create school');
            expect(result.code).toBe(500);
        });
    });

    describe('getSchool', () => {
        it('should get school successfully', async () => {
            const schoolId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
            const mockSchool = {
                _id: schoolId,
                name: 'Test School',
                email: 'test@school.com',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            School.findById.mockResolvedValue(mockSchool);

            const result = await schoolManager.getSchool({ 
                id: schoolId, 
                __shortToken: mockToken 
            });

            expect(School.findById).toHaveBeenCalledWith(schoolId);
            expect(result.school).toBeDefined();
            expect(result.school.id).toBe(schoolId);
        });

        it('should return 404 for non-existent school', async () => {
            const schoolId = '000000000000000000000000'; // Valid ObjectId format
            School.findById.mockResolvedValue(null);

            const result = await schoolManager.getSchool({ 
                id: schoolId, 
                __shortToken: mockToken 
            });

            expect(result.error).toBe('School not found');
            expect(result.code).toBe(404);
        });
    });

    describe('listSchools', () => {
        it('should list schools with pagination', async () => {
            const mockSchools = [
                { _id: '1', name: 'School 1', email: 'school1@test.com' },
                { _id: '2', name: 'School 2', email: 'school2@test.com' }
            ];

            School.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue(mockSchools)
                        })
                    })
                })
            });

            School.countDocuments.mockResolvedValue(2);

            const result = await schoolManager.listSchools({ 
                page: 1, 
                limit: 10, 
                __shortToken: mockToken 
            });

            expect(result.schools).toHaveLength(2);
            expect(result.pagination.total).toBe(2);
            expect(result.pagination.page).toBe(1);
        });
    });
});

// Mock mongoose models
jest.mock('../../../managers/entities/school/School.model');