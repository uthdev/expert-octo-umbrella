const request = require('supertest');
const baseURL = 'http://localhost:5111/api';

describe('Authentication Integration Tests', () => {
    describe('POST /auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await request(baseURL)
                .post('/auth/login')
                .send({
                    email: 'admin@school.com',
                    password: 'admin123'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.longToken).toBeDefined();
            expect(response.body.data.user.role).toBe('superadmin');
        });

        it('should reject invalid credentials', async () => {
            const response = await request(baseURL)
                .post('/auth/login')
                .send({
                    email: 'admin@school.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.ok).toBe(false);
        });

        it('should reject missing credentials', async () => {
            const response = await request(baseURL)
                .post('/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.ok).toBe(false);
        });
    });

    describe('POST /token/v1_createShortToken', () => {
        let longToken;

        beforeAll(async () => {
            const loginResponse = await request(baseURL)
                .post('/auth/login')
                .send({
                    email: 'admin@school.com',
                    password: 'admin123'
                });
            longToken = loginResponse.body.data.longToken;
        });

        it('should create short token with valid long token', async () => {
            const response = await request(baseURL)
                .post('/token/v1_createShortToken')
                .set('token', longToken)
                .set('device', 'test-device')
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.data.shortToken).toBeDefined();
        });

        it('should reject request without long token', async () => {
            const response = await request(baseURL)
                .post('/token/v1_createShortToken')
                .set('device', 'test-device');

            expect(response.status).toBe(401);
        });
    });
});