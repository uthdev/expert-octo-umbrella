const request = require('supertest');
const baseURL = 'http://localhost:5111/api';

describe('School API Integration Tests', () => {
    let shortToken;
    let schoolId;

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
        } catch (error) {
            console.error('Setup failed:', error.message);
            console.error('Make sure the server is running on http://localhost:5111');
            throw error;
        }
    }, 30000);

    describe('POST /schools', () => {
        it('should create school successfully for superadmin', async () => {
            const schoolData = {
                name: 'Test Integration School',
                address: '123 Integration St',
                phone: '1234567890',
                email: `integration-${Date.now()}@test.com`
            };

            const response = await request(baseURL)
                .post('/schools')
                .set('Authorization', `Bearer ${shortToken}`)
                .send(schoolData);

            expect(response.status).toBe(200);
            expect(response.body.data.school).toBeDefined();
            expect(response.body.data.school.name).toBe(schoolData.name);
            
            schoolId = response.body.data.school.id;
        });

        it('should reject duplicate email', async () => {
            const schoolData = {
                name: 'Another School',
                address: '456 Test Ave',
                phone: '0987654321',
                email: `integration-${Date.now()}@test.com`
            };

            // Create first school
            await request(baseURL)
                .post('/schools')
                .set('Authorization', `Bearer ${shortToken}`)
                .send(schoolData);

            // Try to create duplicate
            const response = await request(baseURL)
                .post('/schools')
                .set('Authorization', `Bearer ${shortToken}`)
                .send(schoolData);

            expect(response.status).toBe(400);
            expect(response.body.error || response.body.errors).toBeDefined();
        });
    });

    describe('GET /schools/:id', () => {
        it('should get school successfully', async () => {
            const response = await request(baseURL)
                .get(`/schools/${schoolId}`)
                .set('Authorization', `Bearer ${shortToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.school).toBeDefined();
            expect(response.body.data.school.id).toBe(schoolId);
        });

        it('should return 404 for non-existent school', async () => {
            const response = await request(baseURL)
                .get('/schools/000000000000000000000000')
                .set('Authorization', `Bearer ${shortToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /schools', () => {
        it('should list schools with pagination', async () => {
            const response = await request(baseURL)
                .get('/schools')
                .set('Authorization', `Bearer ${shortToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.data.schools).toBeDefined();
            expect(Array.isArray(response.body.data.schools)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
        });
    });

    describe('PUT /schools/:id', () => {
        it('should update school successfully', async () => {
            const response = await request(baseURL)
                .put(`/schools/${schoolId}`)
                .set('Authorization', `Bearer ${shortToken}`)
                .send({ name: 'Updated Integration School' });

            expect(response.status).toBe(200);
            expect(response.body.data.school.name).toBe('Updated Integration School');
        });
    });

    describe('DELETE /schools/:id', () => {
        it('should delete school successfully', async () => {
            const response = await request(baseURL)
                .delete(`/schools/${schoolId}`)
                .set('Authorization', `Bearer ${shortToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.message).toBeDefined();
        });
    });
});
