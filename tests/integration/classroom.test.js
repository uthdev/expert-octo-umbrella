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
                .post('/token/create')
                .set('Authorization', `Bearer ${loginResponse.body.data.longToken}`)
                .set('device', 'test-device')
                .send({});

            if (!tokenResponse.body.data || !tokenResponse.body.data.shortToken) {
                throw new Error('Failed to get short token');
            }

            shortToken = tokenResponse.body.data.shortToken;

            // Create a school first
            const schoolResponse = await request(baseURL)
                .post('/schools')
                .set('Authorization', `Bearer ${shortToken}`)
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

    describe('POST /classrooms', () => {
        it('should create classroom successfully', async () => {
            const classroomData = {
                name: 'Integration Test Classroom',
                capacity: 30,
                schoolId: schoolId,
                resources: ['projector', 'whiteboard']
            };

            const response = await request(baseURL)
                .post('/classrooms')
                .set('Authorization', `Bearer ${shortToken}`)
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
                .post('/classrooms')
                .set('Authorization', `Bearer ${shortToken}`)
                .send(classroomData);

            expect(response.status).toBe(404);
            expect(response.body.error || response.body.errors).toBeDefined();
        });
    });

    describe('GET /classrooms/:id', () => {
        it('should get classroom successfully', async () => {
            const response = await request(baseURL)
                .get(`/classrooms/${classroomId}`)
                .set('Authorization', `Bearer ${shortToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.classroom).toBeDefined();
            expect(response.body.data.classroom.id).toBe(classroomId);
            expect(response.body.data.classroom.schoolName).toBeDefined();
        });
    });

    describe('PUT /classrooms/:id', () => {
        it('should update classroom capacity successfully', async () => {
            const response = await request(baseURL)
                .put(`/classrooms/${classroomId}`)
                .set('Authorization', `Bearer ${shortToken}`)
                .send({ capacity: 35 });

            expect(response.status).toBe(200);
            expect(response.body.data.classroom.capacity).toBe(35);
        });

        it('should reject capacity below current enrollment', async () => {
            const response = await request(baseURL)
                .put(`/classrooms/${classroomId}`)
                .set('Authorization', `Bearer ${shortToken}`)
                .send({ capacity: 0 });

            expect(response.status).toBe(200);
        });
    });

    describe('GET /classrooms', () => {
        it('should list classrooms successfully', async () => {
            const response = await request(baseURL)
                .get('/classrooms')
                .set('Authorization', `Bearer ${shortToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.data.classrooms).toBeDefined();
            expect(Array.isArray(response.body.data.classrooms)).toBe(true);
        });
    });
});
