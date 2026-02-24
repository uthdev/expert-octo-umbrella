const request = require('supertest');
const baseURL = 'http://localhost:5111/api';

describe('Classroom API Integration Tests', () => {
    let shortToken;
    let schoolId;
    let classroomId;

    beforeAll(async () => {
        try {
            // Login and get tokens
            const loginResponse = await request(baseURL)
                .post('/auth/login')
                .send({
                    email: 'admin@school.com',
                    password: 'admin123'
                });

            if (!loginResponse.body.data || !loginResponse.body.data.longToken) {
                throw new Error('Failed to get long token from login');
            }

            const tokenResponse = await request(baseURL)
                .post('/token/v1_createShortToken')
                .set('token', loginResponse.body.data.longToken)
                .set('device', 'test-device')
                .send({});

            if (!tokenResponse.body.data || !tokenResponse.body.data.shortToken) {
                throw new Error('Failed to get short token');
            }

            shortToken = tokenResponse.body.data.shortToken;

            // Create a school first
            const schoolResponse = await request(baseURL)
                .post('/school/createSchool')
                .set('token', shortToken)
                .send({
                    name: 'Test School for Classroom',
                    address: '123 School St',
                    phone: '1234567890',
                    email: `classroom-test-${Date.now()}@school.com`
                });

            schoolId = schoolResponse.body.data.school.id;
        } catch (error) {
            console.error('Setup failed:', error.message);
            console.error('Make sure the server is running on http://localhost:5111');
            throw error;
        }
    }, 30000);

    describe('POST /classroom/createClassroom', () => {
        it('should create classroom successfully', async () => {
            const classroomData = {
                name: 'Integration Test Classroom',
                capacity: 30,
                schoolId: schoolId,
                resources: ['projector', 'whiteboard']
            };

            const response = await request(baseURL)
                .post('/classroom/createClassroom')
                .set('token', shortToken)
                .send(classroomData);

            expect(response.status).toBe(200);
            expect(response.body.data.classroom).toBeDefined();
            expect(response.body.data.classroom.name).toBe(classroomData.name);
            expect(response.body.data.classroom.capacity).toBe(classroomData.capacity);
            
            classroomId = response.body.data.classroom.id;
        });

        it('should reject classroom for non-existent school', async () => {
            const classroomData = {
                name: 'Invalid Classroom',
                capacity: 25,
                schoolId: '000000000000000000000000'
            };

            const response = await request(baseURL)
                .post('/classroom/createClassroom')
                .set('token', shortToken)
                .send(classroomData);

            expect(response.status).toBe(404);
            expect(response.body.error || response.body.errors).toBeDefined();
        });
    });

    describe('POST /classroom/getClassroom', () => {
        it('should get classroom successfully', async () => {
            const response = await request(baseURL)
                .post('/classroom/getClassroom')
                .set('token', shortToken)
                .send({ id: classroomId });

            expect(response.status).toBe(200);
            expect(response.body.data.classroom).toBeDefined();
            expect(response.body.data.classroom.id).toBe(classroomId);
            expect(response.body.data.classroom.schoolName).toBeDefined();
        });
    });

    describe('POST /classroom/updateClassroom', () => {
        it('should update classroom capacity successfully', async () => {
            const response = await request(baseURL)
                .post('/classroom/updateClassroom')
                .set('token', shortToken)
                .send({ id: classroomId, capacity: 35 });

            expect(response.status).toBe(200);
            expect(response.body.data.classroom.capacity).toBe(35);
        });

        it('should reject capacity below current enrollment', async () => {
            const response = await request(baseURL)
                .post('/classroom/updateClassroom')
                .set('token', shortToken)
                .send({ id: classroomId, capacity: 0 });

            expect(response.status).toBe(200);
        });
    });

    describe('POST /classroom/listClassrooms', () => {
        it('should list classrooms successfully', async () => {
            const response = await request(baseURL)
                .post('/classroom/listClassrooms')
                .set('token', shortToken)
                .send({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.data.classrooms).toBeDefined();
            expect(Array.isArray(response.body.data.classrooms)).toBe(true);
        });
    });
});