const schoolSchema = require('../../../managers/entities/school/school.schema');

describe('School Validators', () => {
    describe('createSchool schema', () => {
        it('should have required fields defined', () => {
            const createSchema = schoolSchema.createSchool;
            
            expect(createSchema).toBeDefined();
            expect(Array.isArray(createSchema)).toBe(true);
            
            const requiredFields = createSchema.filter(field => field.required);
            const fieldPaths = requiredFields.map(field => field.path || field.model);
            
            expect(fieldPaths).toContain('name');
            expect(fieldPaths).toContain('address');
            expect(fieldPaths).toContain('phone');
            expect(fieldPaths).toContain('email');
        });

        it('should have correct field models', () => {
            const createSchema = schoolSchema.createSchool;
            
            const nameField = createSchema.find(field => field.path === 'name');
            const addressField = createSchema.find(field => field.path === 'address');
            const phoneField = createSchema.find(field => field.model === 'phone');
            const emailField = createSchema.find(field => field.model === 'email');
            
            expect(nameField.model).toBe('title');
            expect(addressField.model).toBe('longText');
            expect(phoneField.model).toBe('phone');
            expect(emailField.model).toBe('email');
        });
    });

    describe('updateSchool schema', () => {
        it('should have optional fields for update', () => {
            const updateSchema = schoolSchema.updateSchool;
            
            expect(updateSchema).toBeDefined();
            expect(Array.isArray(updateSchema)).toBe(true);
            
            // All fields should be optional for update
            const requiredFields = updateSchema.filter(field => field.required);
            expect(requiredFields).toHaveLength(0);
            
            const fieldPaths = updateSchema.map(field => field.path || field.model);
            expect(fieldPaths).toContain('name');
            expect(fieldPaths).toContain('address');
            expect(fieldPaths).toContain('phone');
            expect(fieldPaths).toContain('email');
        });
    });

    describe('schema validation logic', () => {
        it('should validate required vs optional correctly', () => {
            const { createSchool, updateSchool } = schoolSchema;
            
            // Create should have required fields
            const createRequired = createSchool.filter(field => field.required).length;
            expect(createRequired).toBeGreaterThan(0);
            
            // Update should have no required fields
            const updateRequired = updateSchool.filter(field => field.required).length;
            expect(updateRequired).toBe(0);
        });
    });
});