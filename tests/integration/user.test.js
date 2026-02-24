const request = require('supertest');
const baseURL = 'http://localhost:5111/api';

describe('User Management Integration Tests', () => {
    let superadminShortToken;
    let schoolAdminShortToken;
    let studentShortToken;
    let schoolId;
    let studentUserId;

    beforeAll(async () => {
        try {
            // Register superadmin
            const registerResponse = await request(baseURL)
                .post('/auth/register')
                .send({
                    email: `superadmin-${Date.now()}@test.com`,
                    password: 'admin123',
                    firstName: 'Super',
                    lastName: 'Admin'
                });

            expect(registerResponse.status).toBe(200);
            const longToken = registerResponse.body.data.longToken;

            // Create short token for superadmin
            const tokenResponse = await request(baseURL)
                .post('/token/create')
                .set('Authorization', `Bearer ${longToken}`)
                .set('device', 'test-device')
                .send({});

            superadminShortToken = tokenResponse.body.data.shortToken;

            // Create a school
            const schoolResponse = await request(baseURL)
                .post('/schools')
                .set('Authorization', `Bearer ${superadminShortToken}`)
                .send({
                    name: 'User Test School',
                    address: '123 Test St',
                    phone: '1234567890',
                    email: `user-test-${Date.now()}@school.com`
                });

            schoolId = schoolResponse.body.data.school.id;
        } catch (error) {
            console.error('Setup failed:', error.message);
            throw error;
        }
    }, 30000);

    describe('POST /auth/register', () => {
        it('should register superadmin successfully', async () => {
            const response = await request(baseURL)
                .post('/auth/register')
                .send({
                    email: `new-admin-${Date.now()}@test.com`,
                    password: 'password123',
                    firstName: 'New',
                    lastName: 'Admin'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.role).toBe('superadmin');
            expect(response.body.data.longToken).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            const email = `duplicate-${Date.now()}@test.com`;
            
            await request(baseURL)
                .post('/auth/register')
                .send({
                    email,
                    password: 'password123',
                    firstName: 'First',
                    lastName: 'User'
                });

            const response = await request(baseURL)
                .post('/auth/register')
                .send({
                    email,
                    password: 'password123',
                    firstName: 'Second',
                    lastName: 'User'
                });

            expect(response.status).toBe(400);
            expect(response.body.error || response.body.errors).toBeDefined();
            if (response.body.error) {
                expect(response.body.error).toContain('already exists');
            }
        });
    });

    describe('POST /users - Create User', () => {
        it('should allow superadmin to create school admin', async () => {
            const response = await request(baseURL)
                .post('/users')
                .set('Authorization', `Bearer ${superadminShortToken}`)
                .send({
                    email: `schooladmin-${Date.now()}@test.com`,
                    password: 'admin123',
                    role: 'school_admin',
                    schoolId: schoolId,
                    firstName: 'School',
                    lastName: 'Admin'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.user.role).toBe('school_admin');
            expect(response.body.data.user.schoolId).toBe(schoolId);

            // Login as school admin
            const loginResponse = await request(baseURL)
                .post('/auth/login')
                .send({
                    email: response.body.data.user.email,
                    password: 'admin123'
                });

            const tokenResponse = await request(baseURL)
                .post('/token/create')
                .set('Authorization', `Bearer ${loginResponse.body.data.longToken}`)
                .set('device', 'test-device')
                .send({});

            schoolAdminShortToken = tokenResponse.body.data.shortToken;
        });

        it('should allow school admin to create student', async () => {
            const response = await request(baseURL)
                .post('/users')
                .set('Authorization', `Bearer ${schoolAdminShortToken}`)
                .send({
                    email: `student-${Date.now()}@test.com`,
                    password: 'student123',
                    role: 'student',
                    schoolId: schoolId,
                    firstName: 'Test',
                    lastName: 'Student'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.user.role).toBe('student');
            studentUserId = response.body.data.user.id;

            // Login as student
            const loginResponse = await request(baseURL)
                .post('/auth/login')
                .send({
                    email: response.body.data.user.email,
                    password: 'student123'
                });

            const tokenResponse = await request(baseURL)
                .post('/token/create')
                .set('Authorization', `Bearer ${loginResponse.body.data.longToken}`)
                .set('device', 'test-device')
                .send({});

            studentShortToken = tokenResponse.body.data.shortToken;
        });

        it('should reject school admin creating non-student user', async () => {
            const response = await request(baseURL)
                .post('/users')
                .set('Authorization', `Bearer ${schoolAdminShortToken}`)
                .send({
                    email: `admin-${Date.now()}@test.com`,
                    password: 'password123',
                    role: 'school_admin',
                    schoolId: schoolId,
                    firstName: 'Another',
                    lastName: 'Admin'
                });

            expect(response.status).toBe(403);
        });
    });

    describe('GET /users - List Users', () => {
        it('should allow superadmin to list all users', async () => {
            const response = await request(baseURL)
                .get('/users')
                .set('Authorization', `Bearer ${superadminShortToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toBeDefined();
            expect(Array.isArray(response.body.data.users)).toBe(true);
        });

        it('should allow school admin to list users in their school', async () => {
            const response = await request(baseURL)
                .get('/users')
                .set('Authorization', `Bearer ${schoolAdminShortToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toBeDefined();
        });

        it('should deny student from listing users', async () => {
            const response = await request(baseURL)
                .get('/users')
                .set('Authorization', `Bearer ${studentShortToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(403);
        });
    });

    describe('GET /profile - Student Profile', () => {
        it('should allow student to view own profile', async () => {
            const response = await request(baseURL)
                .get('/profile')
                .set('Authorization', `Bearer ${studentShortToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.profile).toBeDefined();
            expect(response.body.data.profile.role).toBe('student');
        });

        it('should allow any authenticated user to view profile', async () => {
            const response = await request(baseURL)
                .get('/profile')
                .set('Authorization', `Bearer ${superadminShortToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.profile).toBeDefined();
        });
    });

    describe('PUT /profile - Update Profile', () => {
        it('should allow student to update own profile', async () => {
            const response = await request(baseURL)
                .put('/profile')
                .set('Authorization', `Bearer ${studentShortToken}`)
                .send({
                    firstName: 'Updated',
                    phone: '+1234567890'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.profile.firstName).toBe('Updated');
            expect(response.body.data.profile.phone).toBe('+1234567890');
        });
    });

    describe('GET /users/:id - Get User', () => {
        it('should allow superadmin to get any user', async () => {
            const response = await request(baseURL)
                .get(`/users/${studentUserId}`)
                .set('Authorization', `Bearer ${superadminShortToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.user.id).toBe(studentUserId);
        });

        it('should allow student to get own user record', async () => {
            const response = await request(baseURL)
                .get(`/users/${studentUserId}`)
                .set('Authorization', `Bearer ${studentShortToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.user.id).toBe(studentUserId);
        });
    });

    describe('DELETE /users/:id - Delete User', () => {
        it('should allow superadmin to delete user', async () => {
            // Create a user to delete
            const createResponse = await request(baseURL)
                .post('/users')
                .set('Authorization', `Bearer ${superadminShortToken}`)
                .send({
                    email: `todelete-${Date.now()}@test.com`,
                    password: 'password123',
                    role: 'student',
                    schoolId: schoolId,
                    firstName: 'To',
                    lastName: 'Delete'
                });

            const userId = createResponse.body.data.user.id;

            const response = await request(baseURL)
                .delete(`/users/${userId}`)
                .set('Authorization', `Bearer ${superadminShortToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.message).toContain('deleted');
        });

        it('should deny school admin from deleting users', async () => {
            const response = await request(baseURL)
                .delete(`/users/${studentUserId}`)
                .set('Authorization', `Bearer ${schoolAdminShortToken}`);

            expect(response.status).toBe(403);
        });
    });
});
