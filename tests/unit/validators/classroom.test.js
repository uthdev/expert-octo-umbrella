const classroomSchema = require('../../../managers/entities/classroom/classroom.schema');

describe('Classroom Validators', () => {
    describe('createClassroom schema', () => {
        it('should have required fields defined', () => {
            const createSchema = classroomSchema.createClassroom;
            
            expect(createSchema).toBeDefined();
            expect(Array.isArray(createSchema)).toBe(true);
            
            const requiredFields = createSchema.filter(field => field.required);
            const fieldPaths = requiredFields.map(field => field.path || field.model);
            
            expect(fieldPaths).toContain('name');
            expect(fieldPaths).toContain('capacity');
            expect(fieldPaths).toContain('schoolId');
        });

        it('should have correct field models', () => {
            const createSchema = classroomSchema.createClassroom;
            
            const nameField = createSchema.find(field => field.path === 'name');
            const capacityField = createSchema.find(field => field.path === 'capacity');
            const schoolIdField = createSchema.find(field => field.path === 'schoolId');
            const resourcesField = createSchema.find(field => field.path === 'resources');
            
            expect(nameField.model).toBe('title');
            expect(capacityField.model).toBe('number');
            expect(schoolIdField.model).toBe('objectId');
            expect(resourcesField.model).toBe('array');
        });

        it('should have resources as optional field', () => {
            const createSchema = classroomSchema.createClassroom;
            const resourcesField = createSchema.find(field => field.path === 'resources');
            
            expect(resourcesField.required).toBeFalsy();
        });
    });

    describe('updateClassroom schema', () => {
        it('should have all optional fields for update', () => {
            const updateSchema = classroomSchema.updateClassroom;
            
            expect(updateSchema).toBeDefined();
            expect(Array.isArray(updateSchema)).toBe(true);
            
            // All fields should be optional for update
            const requiredFields = updateSchema.filter(field => field.required);
            expect(requiredFields).toHaveLength(0);
            
            const fieldPaths = updateSchema.map(field => field.path || field.model);
            expect(fieldPaths).toContain('name');
            expect(fieldPaths).toContain('capacity');
            expect(fieldPaths).toContain('resources');
        });

        it('should not include schoolId in update schema', () => {
            const updateSchema = classroomSchema.updateClassroom;
            const schoolIdField = updateSchema.find(field => field.path === 'schoolId');
            
            expect(schoolIdField).toBeUndefined();
        });
    });
});