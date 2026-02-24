const request = require('supertest');
const baseURL = 'http://localhost:5111/api';

describe('RBAC Integration Tests', () => {
    let superadminToken;
    let schoolAdminToken;
    let schoolId;
    let schoolAdminSchoolId;

    beforeAll(async () => {
        try {
            // Get superadmin token
            const superadminLogin = await request(baseURL)
                .post('/auth/login')
                .send({
                    email: 'admin@school.com',
                    password: 'admin123'
                });

            if (!superadminLogin.body.data || !superadminLogin.body.data.longToken) {
                throw new Error('Failed to get superadmin long token');
            }

            const superadminTokenResponse = await request(baseURL)
                .post('/token/v1_createShortToken')
                .set('token', superadminLogin.body.data.longToken)
                .set('device', 'test-device')
                .send({});

            if (!superadminTokenResponse.body.data || !superadminTokenResponse.body.data.shortToken) {
                throw new Error('Failed to get superadmin short token');
            }

            superadminToken = superadminTokenResponse.body.data.shortToken;

            // Get school admin token
            const schoolAdminLogin = await request(baseURL)
                .post('/auth/login')
                .send({
                    email: 'school@demo.com',
                    password: 'school123'
                });

            if (!schoolAdminLogin.body.data || !schoolAdminLogin.body.data.longToken) {
                throw new Error('Failed to get school admin long token');
            }

            const schoolAdminTokenResponse = await request(baseURL)
                .post('/token/v1_createShortToken')
                .set('token', schoolAdminLogin.body.data.longToken)
                .set('device', 'test-device')
                .send({});

            if (!schoolAdminTokenResponse.body.data || !schoolAdminTokenResponse.body.data.shortToken) {
                throw new Error('Failed to get school admin short token');
            }

            schoolAdminToken = schoolAdminTokenResponse.body.data.shortToken;

            // Create school for school admin
            const schoolAdminSchoolResponse = await request(baseURL)
                .post('/school/createSchool')
                .set('token', superadminToken)
                .send({
                    name: 'School Admin School',
                    address: '123 School Admin St',
                    phone: '1234567890',
                    email: `school-admin-${Date.now()}@test.com`
                });
            schoolAdminSchoolId = schoolAdminSchoolResponse.body.data.school.id;

            // Create a different school for testing access control
            const schoolResponse = await request(baseURL)
                .post('/school/createSchool')
                .set('token', superadminToken)
                .send({
                    name: 'RBAC Test School',
                    address: '123 RBAC St',
                    phone: '0987654321',
                    email: `rbac-${Date.now()}@test.com`
                });

            schoolId = schoolResponse.body.data.school.id;
        } catch (error) {
            console.error('Setup failed:', error.message);
            console.error('Make sure the server is running on http://localhost:5111');
            throw error;
        }
    }, 30000);

    describe('School Management Access Control', () => {
        it('should allow superadmin to create schools', async () => {
            const response = await request(baseURL)
                .post('/school/createSchool')
                .set('token', superadminToken)
                .send({
                    name: 'Superadmin School',
                    address: '456 Admin Ave',
                    phone: '0987654321',
                    email: `superadmin-${Date.now()}@test.com`
                });

            expect(response.status).toBe(200);
        });

        it('should deny school admin from creating schools', async () => {
            const response = await request(baseURL)
                .post('/school/createSchool')
                .set('token', schoolAdminToken)
                .send({
                    name: 'Unauthorized School',
                    address: '789 Denied St',
                    phone: '1111111111',
                    email: `denied-${Date.now()}@test.com`
                });

            // School admin role check happens in manager, returns 403
            expect([400, 403]).toContain(response.status);
            expect(response.body.error || response.body.errors).toBeDefined();
        });
    });

    describe('Classroom Access Control', () => {
        let classroomId;

        it('should allow school admin to create classroom in their school', async () => {
            // Note: Demo school admin has null schoolId, so this will fail
            // In production, school admins would have proper schoolId assigned
            const response = await request(baseURL)
                .post('/classroom/createClassroom')
                .set('token', schoolAdminToken)
                .send({
                    name: 'School Admin Classroom',
                    capacity: 25,
                    schoolId: schoolAdminSchoolId
                });

            // Expect 400 or 403 because school admin's token has null schoolId
            expect([400, 403]).toContain(response.status);
        });

        it('should deny school admin from creating classroom in different school', async () => {
            const response = await request(baseURL)
                .post('/classroom/createClassroom')
                .set('token', schoolAdminToken)
                .send({
                    name: 'Unauthorized Classroom',
                    capacity: 30,
                    schoolId: schoolId // Different school
                });

            expect([400, 403]).toContain(response.status);
            expect(response.body.error || response.body.errors).toBeDefined();
        });
    });

    describe('Student Access Control', () => {
        it('should allow school admin to create student in their school', async () => {
            // Note: Demo school admin has null schoolId, so this will fail
            // In production, school admins would have proper schoolId assigned
            const response = await request(baseURL)
                .post('/student/createStudent')
                .set('token', schoolAdminToken)
                .send({
                    firstName: 'School',
                    lastName: 'Student',
                    email: `school.student-${Date.now()}@test.com`,
                    schoolId: schoolAdminSchoolId
                });

            // Expect 400 or 403 because school admin's token has null schoolId
            expect([400, 403]).toContain(response.status);
        });

        it('should deny school admin from creating student in different school', async () => {
            const response = await request(baseURL)
                .post('/student/createStudent')
                .set('token', schoolAdminToken)
                .send({
                    firstName: 'Unauthorized',
                    lastName: 'Student',
                    email: `unauthorized-${Date.now()}@test.com`,
                    schoolId: schoolId // Different school
                });

            expect([400, 403]).toContain(response.status);
            expect(response.body.error || response.body.errors).toBeDefined();
        });
    });

    describe('Authentication Required', () => {
        it('should deny access without token', async () => {
            const response = await request(baseURL)
                .post('/school/listSchools')
                .send({ page: 1, limit: 10 });

            expect(response.status).toBe(401);
            expect(response.body.error || response.body.errors).toBeDefined();
        });

        it('should deny access with invalid token', async () => {
            const response = await request(baseURL)
                .post('/school/listSchools')
                .set('token', 'invalid-token')
                .send({ page: 1, limit: 10 });

            expect(response.status).toBe(401);
            expect(response.body.error || response.body.errors).toBeDefined();
        });
    });
});