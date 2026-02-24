# School Management System API

A RESTful API service for managing schools, classrooms, and students with role-based access control. Built using the Axion architecture template with MongoDB for data persistence.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [Error Codes](#error-codes)
- [Database Schema](#database-schema)
- [Demo Credentials](#demo-credentials)

## Features

- **Interactive API Documentation**
  - Swagger UI at `/api-docs` for testing endpoints
  - Complete OpenAPI 3.0 specification
  
- **Role-Based Access Control (RBAC)**
  - Superadmin: Full system access
  - School Admin: School-specific resource management
  
- **Entity Management**
  - Schools: Complete CRUD operations (superadmin only)
  - Classrooms: CRUD with capacity and resource management
  - Students: CRUD with enrollment and transfer capabilities

- **Security**
  - JWT-based authentication (long token + short token flow)
  - Rate limiting (100 requests per 15 minutes)
  - Input validation and sanitization
  - Helmet security headers

- **Testing**
  - 67 automated tests (34 unit + 33 integration)
  - 100% test success rate

## Architecture

This project follows the **Axion Manager-Based Architecture** pattern:

- **Managers**: Business logic encapsulated in manager classes
- **Loaders**: Dependency injection system
- **Middleware**: Request processing pipeline
- **Auto-Routing**: Routes generated from `httpExposed` arrays
- **Response Dispatcher**: Centralized response handling

All API routes follow the pattern: `POST /api/{entity}/{method}`

## Prerequisites

- Node.js >= 14.x
- MongoDB >= 4.x
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd expert-octo-umbrella
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration (see [Environment Variables](#environment-variables))

5. Ensure MongoDB is running:
```bash
# If using local MongoDB
mongod
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Service Configuration
SERVICE_NAME=school-management-api
ENV=development

# Server Ports
USER_PORT=5111
ADMIN_PORT=5222

# Database Configuration
MONGO_URI=mongodb://localhost:27017/school-management-api

# JWT Secrets (Generate strong secrets for production)
LONG_TOKEN_SECRET=your-long-token-secret-min-32-characters-long
SHORT_TOKEN_SECRET=your-short-token-secret-min-32-characters-long
NACL_SECRET=your-nacl-secret-min-32-characters-long

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** Generate strong, unique secrets for production environments.

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The API will be available at `http://localhost:5111/api`

**Swagger Documentation:** Access interactive API documentation at `http://localhost:5111/api-docs`

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

**Note:** Integration tests automatically start/stop the server. No manual server management required.

## Authentication Flow

The API uses a **two-token JWT authentication system** similar to refresh token + access token pattern:

- **Long Token** = Refresh Token (long-lived, used to create short tokens)
- **Short Token** = Access Token (short-lived, used for API requests)

### Complete Authentication Flow:

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Login → Get LONG TOKEN (Refresh Token)            │
│  Step 2: Create Short Token → Get SHORT TOKEN (Access)     │
│  Step 3: Use Short Token → Make API Requests               │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Login to Get Long Token

**Where you get the long token:** From the login endpoint!

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "superadmin_001",
      "email": "admin@school.com",
      "role": "superadmin",
      "schoolId": null
    },
    "longToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  ← THIS IS YOUR LONG TOKEN
  }
}
```

### Step 2: Create Short Token from Long Token

**Use the long token to get a short token:**

```bash
POST /api/token/create
Authorization: Bearer <longToken-from-step-1>
device: my-device-id
Content-Type: application/json

{}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "shortToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  ← THIS IS YOUR SHORT TOKEN
  }
}
```

### Step 3: Use Short Token for API Requests

**All API requests require the short token:**

```bash
GET /api/schools?page=1&limit=10
Authorization: Bearer <shortToken-from-step-2>
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "schools": [...],
    "pagination": {...}
  }
}
```

### Step 4: Logout (Optional)

```bash
POST /api/auth/logout
Authorization: Bearer <shortToken>

{}
```

### Token Comparison:

| Feature | Long Token (Refresh) | Short Token (Access) |
|---------|---------------------|---------------------|
| **Purpose** | Create short tokens | Make API requests |
| **Lifespan** | Long-lived | Short-lived |
| **Where to get** | Login endpoint | Token create endpoint |
| **Used for** | Authentication | Authorization |
| **Bearer format** | ✅ Yes | ✅ Yes |

### Quick Start Example:

```bash
# 1. Login
curl -X POST http://localhost:5111/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'

# Save the longToken from response

# 2. Create short token
curl -X POST http://localhost:5111/api/token/create \
  -H "Authorization: Bearer YOUR_LONG_TOKEN" \
  -H "device: my-device"

# Save the shortToken from response

# 3. Use short token for API calls
curl -X GET http://localhost:5111/api/schools?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_SHORT_TOKEN"
```

## API Endpoints

All endpoints use `POST` method and require authentication (except login).

### Authentication

#### Login
- **Endpoint:** `POST /api/auth/login`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "email": "admin@school.com",
    "password": "admin123"
  }
  ```
- **Success Response:** `200 OK`
  ```json
  {
    "ok": true,
    "data": {
      "user": { "id": "...", "email": "...", "role": "..." },
      "longToken": "..."
    }
  }
  ```

#### Logout
- **Endpoint:** `POST /api/auth/logout`
- **Auth Required:** Yes (short token)
- **Body:** `{}`
- **Success Response:** `200 OK`

#### Create Short Token
- **Endpoint:** `POST /api/token/v1_createShortToken`
- **Headers:** `token: <longToken>`, `device: <device-id>`
- **Body:** `{}`
- **Success Response:** `200 OK`
  ```json
  {
    "ok": true,
    "data": { "shortToken": "..." }
  }
  ```

---

### Schools (Superadmin Only)

#### Create School
- **Endpoint:** `POST /api/school/createSchool`
- **Auth Required:** Yes (superadmin)
- **Body:**
  ```json
  {
    "name": "Springfield Elementary",
    "address": "123 Main St, Springfield, IL 62701",
    "phone": "+15551234567",
    "email": "admin@springfield.edu"
  }
  ```
- **Success Response:** `200 OK`
  ```json
  {
    "ok": true,
    "data": {
      "school": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "Springfield Elementary",
        "address": "123 Main St, Springfield, IL 62701",
        "phone": "+15551234567",
        "email": "admin@springfield.edu",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    }
  }
  ```

#### Get School
- **Endpoint:** `POST /api/school/getSchool`
- **Auth Required:** Yes
- **Body:** `{ "id": "64f8a1b2c3d4e5f6a7b8c9d0" }`
- **Success Response:** `200 OK`

#### Update School
- **Endpoint:** `POST /api/school/updateSchool`
- **Auth Required:** Yes (superadmin)
- **Body:**
  ```json
  {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Updated School Name",
    "address": "New Address",
    "phone": "+15559876543",
    "email": "new@email.com"
  }
  ```
- **Success Response:** `200 OK`

#### Delete School
- **Endpoint:** `POST /api/school/deleteSchool`
- **Auth Required:** Yes (superadmin)
- **Body:** `{ "id": "64f8a1b2c3d4e5f6a7b8c9d0" }`
- **Success Response:** `200 OK`

#### List Schools
- **Endpoint:** `POST /api/school/listSchools`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "page": 1,
    "limit": 10
  }
  ```
- **Success Response:** `200 OK`
  ```json
  {
    "ok": true,
    "data": {
      "schools": [...],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25,
        "pages": 3
      }
    }
  }
  ```

---

### Classrooms (School Admin + Superadmin)

#### Create Classroom
- **Endpoint:** `POST /api/classroom/createClassroom`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "name": "Math 101",
    "capacity": 30,
    "schoolId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "resources": ["projector", "whiteboard", "computers"]
  }
  ```
- **Success Response:** `200 OK`
- **Note:** School admins can only create classrooms in their assigned school

#### Get Classroom
- **Endpoint:** `POST /api/classroom/getClassroom`
- **Auth Required:** Yes
- **Body:** `{ "id": "64f8a1b2c3d4e5f6a7b8c9d1" }`
- **Success Response:** `200 OK`
  ```json
  {
    "ok": true,
    "data": {
      "classroom": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Math 101",
        "capacity": 30,
        "currentEnrollment": 25,
        "schoolId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "schoolName": "Springfield Elementary",
        "resources": ["projector", "whiteboard"],
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    }
  }
  ```

#### Update Classroom
- **Endpoint:** `POST /api/classroom/updateClassroom`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Advanced Math",
    "capacity": 35,
    "resources": ["projector", "whiteboard", "computers", "tablets"]
  }
  ```
- **Success Response:** `200 OK`

#### Delete Classroom
- **Endpoint:** `POST /api/classroom/deleteClassroom`
- **Auth Required:** Yes
- **Body:** `{ "id": "64f8a1b2c3d4e5f6a7b8c9d1" }`
- **Success Response:** `200 OK`

#### List Classrooms
- **Endpoint:** `POST /api/classroom/listClassrooms`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "page": 1,
    "limit": 10,
    "schoolId": "64f8a1b2c3d4e5f6a7b8c9d0"
  }
  ```
- **Success Response:** `200 OK`
- **Note:** School admins automatically see only their school's classrooms

---

### Students (School Admin + Superadmin)

#### Create Student
- **Endpoint:** `POST /api/student/createStudent`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@student.com",
    "phone": "+15551234567",
    "schoolId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "classroomId": "64f8a1b2c3d4e5f6a7b8c9d1"
  }
  ```
- **Success Response:** `200 OK`
  ```json
  {
    "ok": true,
    "data": {
      "student": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "email": "john.doe@student.com",
        "phone": "+15551234567",
        "schoolId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "classroomId": "64f8a1b2c3d4e5f6a7b8c9d1",
        "status": "active",
        "enrollmentDate": "2024-01-15T10:30:00.000Z"
      }
    }
  }
  ```

#### Get Student
- **Endpoint:** `POST /api/student/getStudent`
- **Auth Required:** Yes
- **Body:** `{ "id": "64f8a1b2c3d4e5f6a7b8c9d2" }`
- **Success Response:** `200 OK`

#### Update Student
- **Endpoint:** `POST /api/student/updateStudent`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "firstName": "Jane",
    "phone": "+15559876543",
    "status": "active"
  }
  ```
- **Success Response:** `200 OK`

#### Delete Student
- **Endpoint:** `POST /api/student/deleteStudent`
- **Auth Required:** Yes
- **Body:** `{ "id": "64f8a1b2c3d4e5f6a7b8c9d2" }`
- **Success Response:** `200 OK`

#### List Students
- **Endpoint:** `POST /api/student/listStudents`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "page": 1,
    "limit": 10,
    "schoolId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "classroomId": "64f8a1b2c3d4e5f6a7b8c9d1"
  }
  ```
- **Success Response:** `200 OK`

#### Transfer Student
- **Endpoint:** `POST /api/student/transferStudent`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "newClassroomId": "64f8a1b2c3d4e5f6a7b8c9d3"
  }
  ```
- **Success Response:** `200 OK`
- **Note:** Transfers student to a different classroom within the same school

---

## Error Codes

All error responses follow this format:
```json
{
  "ok": false,
  "error": "Error message description",
  "code": 400
}
```

### HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| **400** | Bad Request | Invalid input, missing required fields, validation errors, duplicate email |
| **401** | Unauthorized | Missing token, invalid token, expired token |
| **403** | Forbidden | Insufficient permissions, role mismatch, school access denied |
| **404** | Not Found | Resource doesn't exist (school, classroom, student) |
| **429** | Too Many Requests | Rate limit exceeded (100 requests per 15 minutes) |
| **500** | Internal Server Error | Database errors, unexpected server errors |

### Common Error Messages

#### Authentication Errors
- `"Authentication required"` - No token provided
- `"Invalid token"` - Token is malformed or expired
- `"Invalid credentials"` - Wrong email or password

#### Authorization Errors
- `"Only superadmins can create schools"` - School admin trying to create school
- `"Access denied. You can only access resources from your school"` - School admin accessing different school
- `"Insufficient permissions"` - User lacks required role

#### Validation Errors
- `"Email and password are required"` - Missing login credentials
- `"Invalid school ID format"` - ID is not a valid MongoDB ObjectId
- `"School with this email already exists"` - Duplicate school email
- `"Student with this email already exists in this school"` - Duplicate student email

#### Resource Errors
- `"School not found"` - School ID doesn't exist
- `"Classroom not found"` - Classroom ID doesn't exist
- `"Student not found"` - Student ID doesn't exist
- `"Classroom is at full capacity"` - Cannot enroll more students

#### Rate Limiting
- `"Too many requests. Please try again later."` - Exceeded 100 requests in 15 minutes

---

## Database Schema

### School Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  address: String (required),
  phone: String (required),
  email: String (required, unique, indexed),
  status: String (default: "active"),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)
- `status`

---

### Classroom Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  capacity: Number (required, min: 1),
  schoolId: ObjectId (required, ref: "School", indexed),
  resources: [String],
  currentEnrollment: Number (default: 0),
  status: String (default: "active"),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `schoolId`
- `status`

**Relationships:**
- `schoolId` → School._id (Many-to-One)

---

### Student Collection
```javascript
{
  _id: ObjectId,
  firstName: String (required),
  lastName: String (required),
  email: String (required, indexed),
  phone: String,
  schoolId: ObjectId (required, ref: "School", indexed),
  classroomId: ObjectId (ref: "Classroom", indexed),
  status: String (default: "active"),
  enrollmentDate: Date (default: now),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` + `schoolId` (compound unique index)
- `schoolId`
- `classroomId`
- `status`

**Relationships:**
- `schoolId` → School._id (Many-to-One)
- `classroomId` → Classroom._id (Many-to-One)

---

### Database Schema Diagram

```
┌─────────────────┐
│     School      │
│─────────────────│
│ _id (PK)        │
│ name            │
│ address         │
│ phone           │
│ email (unique)  │
│ status          │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│   Classroom     │
│─────────────────│
│ _id (PK)        │
│ name            │
│ capacity        │
│ schoolId (FK)   │
│ resources[]     │
│ currentEnroll   │
│ status          │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│    Student      │
│─────────────────│
│ _id (PK)        │
│ firstName       │
│ lastName        │
│ email           │
│ phone           │
│ schoolId (FK)   │
│ classroomId(FK) │
│ status          │
│ enrollmentDate  │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

**Relationships:**
- One School has many Classrooms
- One School has many Students
- One Classroom has many Students
- One Classroom belongs to one School
- One Student belongs to one School
- One Student belongs to one Classroom (optional)

---

## Demo Credentials

The system uses **hardcoded demo users** for authentication. There is **no registration/signup endpoint** - only pre-configured users can login.

### Superadmin Account
```
Email: admin@school.com
Password: admin123
Role: superadmin
Access: Full system access
```

### School Admin Account
```
Email: school@demo.com
Password: school123
Role: school_admin
Access: School-specific resources only
Note: Demo account has null schoolId
```

**Important:** 
- These are the only users that can login to the system
- No account creation/registration endpoint is available
- In production, implement a User model and database-backed authentication

---

## Project Structure

```
expert-octo-umbrella/
├── managers/
│   ├── entities/
│   │   ├── auth/          # Authentication logic
│   │   ├── school/        # School CRUD operations
│   │   ├── classroom/     # Classroom CRUD operations
│   │   └── student/       # Student CRUD operations
│   ├── api/               # API handler
│   ├── http/              # HTTP server
│   └── token/             # JWT token management
├── mws/                   # Middleware (auth, RBAC, rate limiting)
├── loaders/               # Dependency injection loaders
├── tests/
│   ├── unit/              # Unit tests (34 tests)
│   └── integration/       # Integration tests (33 tests)
├── config/                # Configuration files
├── constants/             # Role constants
├── utils/                 # Utility functions
├── .env                   # Environment variables (create from .env.example)
├── app.js                 # Application entry point
└── package.json           # Dependencies and scripts
```

---

## Testing Coverage

- **Total Tests:** 67
- **Unit Tests:** 34 (Manager logic, validators)
- **Integration Tests:** 33 (API endpoints, authentication, RBAC)
- **Success Rate:** 100%

Test categories:
- Authentication flow
- School CRUD operations
- Classroom CRUD operations
- Student CRUD operations
- Role-based access control
- Error handling

---

## Security Features

1. **JWT Authentication:** Two-token system (long + short tokens)
2. **Role-Based Access Control:** Superadmin and School Admin roles
3. **Rate Limiting:** 100 requests per 15 minutes per IP
4. **Input Validation:** MongoDB ObjectId validation, required field checks
5. **Security Headers:** Helmet middleware for HTTP security
6. **Input Sanitization:** XSS protection
7. **Password Hashing:** Bcrypt for password storage

---

## License

ISC

---

## Support

For issues or questions, please create an issue in the repository.
