const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management System API',
      version: '1.0.0',
      description: 'A RESTful API service for managing schools, classrooms, and students with role-based access control',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5111',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Short Token - Get it by: 1) POST /api/auth/login (returns longToken), 2) POST /api/token/create with longToken (returns shortToken), 3) Use shortToken here',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            code: {
              type: 'integer',
              example: 400,
            },
          },
        },
        School: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '64f8a1b2c3d4e5f6a7b8c9d0',
            },
            name: {
              type: 'string',
              example: 'Springfield Elementary',
            },
            address: {
              type: 'string',
              example: '123 Main St, Springfield, IL 62701',
            },
            phone: {
              type: 'string',
              example: '+15551234567',
            },
            email: {
              type: 'string',
              example: 'admin@springfield.edu',
            },
            status: {
              type: 'string',
              example: 'active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Classroom: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '64f8a1b2c3d4e5f6a7b8c9d1',
            },
            name: {
              type: 'string',
              example: 'Math 101',
            },
            capacity: {
              type: 'integer',
              example: 30,
            },
            schoolId: {
              type: 'string',
              example: '64f8a1b2c3d4e5f6a7b8c9d0',
            },
            schoolName: {
              type: 'string',
              example: 'Springfield Elementary',
            },
            resources: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['projector', 'whiteboard'],
            },
            currentEnrollment: {
              type: 'integer',
              example: 25,
            },
            status: {
              type: 'string',
              example: 'active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '64f8a1b2c3d4e5f6a7b8c9d2',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            fullName: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              example: 'john.doe@student.com',
            },
            phone: {
              type: 'string',
              example: '+15551234567',
            },
            schoolId: {
              type: 'string',
              example: '64f8a1b2c3d4e5f6a7b8c9d0',
            },
            classroomId: {
              type: 'string',
              example: '64f8a1b2c3d4e5f6a7b8c9d1',
            },
            status: {
              type: 'string',
              example: 'active',
            },
            enrollmentDate: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./config/swagger/swagger.routes.js'],
};

module.exports = swaggerJsdoc(options);
