const studentSchema = require('../../../managers/entities/student/student.schema');

describe('Student Validators', () => {
    describe('createStudent schema', () => {
        it('should have required fields defined', () => {
            const createSchema = studentSchema.createStudent;
            
            expect(createSchema).toBeDefined();
            expect(Array.isArray(createSchema)).toBe(true);
            
            const requiredFields = createSchema.filter(field => field.required);
            const fieldPaths = requiredFields.map(field => field.path || field.model);
            
            expect(fieldPaths).toContain('firstName');
            expect(fieldPaths).toContain('lastName');
            expect(fieldPaths).toContain('email');
            expect(fieldPaths).toContain('schoolId');
        });

        it('should have correct field models', () => {
            const createSchema = studentSchema.createStudent;
            
            const firstNameField = createSchema.find(field => field.path === 'firstName');
            const lastNameField = createSchema.find(field => field.path === 'lastName');
            const emailField = createSchema.find(field => field.model === 'email');
            const phoneField = createSchema.find(field => field.model === 'phone');
            const schoolIdField = createSchema.find(field => field.path === 'schoolId');
            const classroomIdField = createSchema.find(field => field.path === 'classroomId');
            
            expect(firstNameField.model).toBe('name');
            expect(lastNameField.model).toBe('name');
            expect(emailField.model).toBe('email');
            expect(phoneField.model).toBe('phone');
            expect(schoolIdField.model).toBe('objectId');
            expect(classroomIdField.model).toBe('objectId');
        });

        it('should have optional fields', () => {
            const createSchema = studentSchema.createStudent;
            
            const phoneField = createSchema.find(field => field.model === 'phone');
            const classroomIdField = createSchema.find(field => field.path === 'classroomId');
            
            expect(phoneField.required).toBeFalsy();
            expect(classroomIdField.required).toBeFalsy();
        });
    });

    describe('updateStudent schema', () => {
        it('should have all optional fields for update', () => {
            const updateSchema = studentSchema.updateStudent;
            
            expect(updateSchema).toBeDefined();
            expect(Array.isArray(updateSchema)).toBe(true);
            
            // All fields should be optional for update
            const requiredFields = updateSchema.filter(field => field.required);
            expect(requiredFields).toHaveLength(0);
            
            const fieldPaths = updateSchema.map(field => field.path || field.model);
            expect(fieldPaths).toContain('firstName');
            expect(fieldPaths).toContain('lastName');
            expect(fieldPaths).toContain('email');
            expect(fieldPaths).toContain('phone');
        });

        it('should not include schoolId or classroomId in update schema', () => {
            const updateSchema = studentSchema.updateStudent;
            
            const schoolIdField = updateSchema.find(field => field.path === 'schoolId');
            const classroomIdField = updateSchema.find(field => field.path === 'classroomId');
            
            expect(schoolIdField).toBeUndefined();
            expect(classroomIdField).toBeUndefined();
        });
    });

    describe('transferStudent schema', () => {
        it('should have newClassroomId as required field', () => {
            const transferSchema = studentSchema.transferStudent;
            
            expect(transferSchema).toBeDefined();
            expect(Array.isArray(transferSchema)).toBe(true);
            
            const newClassroomIdField = transferSchema.find(field => field.path === 'newClassroomId');
            
            expect(newClassroomIdField).toBeDefined();
            expect(newClassroomIdField.model).toBe('objectId');
            expect(newClassroomIdField.required).toBe(true);
        });
    });
});