const request = require('supertest');
const baseURL = 'http://localhost:5111/api';

describe('Student API Integration Tests', () => {
    let shortToken;
    let schoolId;
    let classroomId;
    let studentId;

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

            // Create school and classroom
            const schoolResponse = await request(baseURL)
                .post('/school/createSchool')
                .set('token', shortToken)
                .send({
                    name: 'Student Test School',
                    address: '123 Student St',
                    phone: '1234567890',
                    email: `student-test-${Date.now()}@school.com`
                });

            schoolId = schoolResponse.body.data.school.id;

            const classroomResponse = await request(baseURL)
                .post('/classroom/createClassroom')
                .set('token', shortToken)
                .send({
                    name: 'Student Test Classroom',
                    capacity: 30,
                    schoolId: schoolId
                });

            classroomId = classroomResponse.body.data.classroom.id;
        } catch (error) {
            console.error('Setup failed:', error.message);
            console.error('Make sure the server is running on http://localhost:5111');
            throw error;
        }
    }, 30000);

    describe('POST /student/createStudent', () => {
        it('should create student successfully', async () => {
            const studentData = {
                firstName: 'John',
                lastName: 'Doe',
                email: `john.doe-${Date.now()}@student.com`,
                phone: '1234567890',
                schoolId: schoolId,
                classroomId: classroomId
            };

            const response = await request(baseURL)
                .post('/student/createStudent')
                .set('token', shortToken)
                .send(studentData);

            expect(response.status).toBe(200);
            expect(response.body.data.student).toBeDefined();
            expect(response.body.data.student.firstName).toBe(studentData.firstName);
            expect(response.body.data.student.fullName).toBe('John Doe');
            
            studentId = response.body.data.student.id;
        });

        it('should reject duplicate email in same school', async () => {
            const email = `duplicate-${Date.now()}@student.com`;
            const studentData = {
                firstName: 'Jane',
                lastName: 'Doe',
                email: email,
                schoolId: schoolId
            };

            // Create first student
            await request(baseURL)
                .post('/student/createStudent')
                .set('token', shortToken)
                .send(studentData);

            // Try duplicate
            const response = await request(baseURL)
                .post('/student/createStudent')
                .set('token', shortToken)
                .send(studentData);

            expect(response.status).toBe(400);
            expect(response.body.error || response.body.errors).toBeDefined();
        });
    });

    describe('POST /student/getStudent', () => {
        it('should get student successfully', async () => {
            const response = await request(baseURL)
                .post('/student/getStudent')
                .set('token', shortToken)
                .send({ id: studentId });

            expect(response.status).toBe(200);
            expect(response.body.data.student).toBeDefined();
            expect(response.body.data.student.id).toBe(studentId);
            expect(response.body.data.student.schoolName).toBeDefined();
            expect(response.body.data.student.classroomName).toBeDefined();
        });
    });

    describe('POST /student/updateStudent', () => {
        it('should update student successfully', async () => {
            const response = await request(baseURL)
                .post('/student/updateStudent')
                .set('token', shortToken)
                .send({ id: studentId, firstName: 'Johnny', phone: '0987654321' });

            expect(response.status).toBe(200);
            expect(response.body.data.student.firstName).toBe('Johnny');
            expect(response.body.data.student.phone).toBe('0987654321');
        });
    });

    describe('POST /student/transferStudent', () => {
        let newClassroomId;

        beforeAll(async () => {
            try {
                // Create another classroom for transfer
                const classroomResponse = await request(baseURL)
                    .post('/classroom/createClassroom')
                    .set('token', shortToken)
                    .send({
                        name: 'Transfer Classroom',
                        capacity: 25,
                        schoolId: schoolId
                    });

                newClassroomId = classroomResponse.body.data.classroom.id;
            } catch (error) {
                console.error('Transfer classroom setup failed:', error.message);
                throw error;
            }
        }, 30000);

        it('should transfer student successfully', async () => {
            const response = await request(baseURL)
                .post('/student/transferStudent')
                .set('token', shortToken)
                .send({ id: studentId, newClassroomId: newClassroomId });

            expect(response.status).toBe(200);
            expect(response.body.data.message || response.body.message).toBe('Student transferred successfully');
            expect(response.body.data.student.classroomId).toBe(newClassroomId);
        });

        it('should reject transfer to same classroom', async () => {
            const response = await request(baseURL)
                .post('/student/transferStudent')
                .set('token', shortToken)
                .send({ id: studentId, newClassroomId: newClassroomId });

            expect(response.status).toBe(400);
            expect(response.body.error || response.body.errors).toBeDefined();
        });
    });

    describe('POST /student/listStudents', () => {
        it('should list students successfully', async () => {
            const response = await request(baseURL)
                .post('/student/listStudents')
                .set('token', shortToken)
                .send({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.data.students).toBeDefined();
            expect(Array.isArray(response.body.data.students)).toBe(true);
            expect(response.body.data.students.length).toBeGreaterThan(0);
        });
    });
});