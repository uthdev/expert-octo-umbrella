const School = require('./School.model');
const roles = require('../../../constants/roles');

module.exports = class SchoolManager {
    constructor({ utils, cache, config, cortex, managers, validators }) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.tokenManager = managers.token;
        
        this.httpExposed = ['createSchool', 'getSchool', 'updateSchool', 'deleteSchool', 'listSchools'];
    }

    async createSchool({ name, address, phone, email, __shortToken }) {
        // Check superadmin permission
        if (__shortToken.role !== roles.SUPERADMIN) {
            return { error: 'Only superadmins can create schools', code: 403 };
        }

        try {
            // Check if school with email already exists
            const existingSchool = await School.findOne({ email });
            if (existingSchool) {
                return { error: 'School with this email already exists', code: 400 };
            }

            // Create school
            const school = new School({ name, address, phone, email });
            await school.save();

            return {
                school: {
                    id: school._id,
                    name: school.name,
                    address: school.address,
                    phone: school.phone,
                    email: school.email,
                    status: school.status,
                    createdAt: school.createdAt
                }
            };
        } catch (error) {
            console.error('Create school error:', error);
            return { error: 'Failed to create school', code: 500 };
        }
    }

    async getSchool({ id, __shortToken }) {
        try {
            // Validate ObjectId format
            if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
                return { error: 'Invalid school ID format', code: 400 };
            }

            const school = await School.findById(id);
            if (!school) {
                return { error: 'School not found', code: 404 };
            }

            return {
                school: {
                    id: school._id,
                    name: school.name,
                    address: school.address,
                    phone: school.phone,
                    email: school.email,
                    status: school.status,
                    createdAt: school.createdAt,
                    updatedAt: school.updatedAt
                }
            };
        } catch (error) {
            console.error('Get school error:', error);
            return { error: 'Failed to get school', code: 500 };
        }
    }

    async updateSchool({ id, name, address, phone, email, __shortToken }) {
        // Check superadmin permission
        if (__shortToken.role !== roles.SUPERADMIN) {
            return { error: 'Only superadmins can update schools', code: 403 };
        }

        try {
            const school = await School.findById(id);
            if (!school) {
                return { error: 'School not found', code: 404 };
            }

            // Update fields if provided
            if (name) school.name = name;
            if (address) school.address = address;
            if (phone) school.phone = phone;
            if (email) {
                // Check if email is already taken by another school
                const existingSchool = await School.findOne({ email, _id: { $ne: id } });
                if (existingSchool) {
                    return { error: 'Email already taken by another school', code: 400 };
                }
                school.email = email;
            }

            await school.save();

            return {
                school: {
                    id: school._id,
                    name: school.name,
                    address: school.address,
                    phone: school.phone,
                    email: school.email,
                    status: school.status,
                    updatedAt: school.updatedAt
                }
            };
        } catch (error) {
            console.error('Update school error:', error);
            return { error: 'Failed to update school', code: 500 };
        }
    }

    async deleteSchool({ id, __shortToken }) {
        // Check superadmin permission
        if (__shortToken.role !== roles.SUPERADMIN) {
            return { error: 'Only superadmins can delete schools', code: 403 };
        }

        try {
            const school = await School.findById(id);
            if (!school) {
                return { error: 'School not found', code: 404 };
            }

            await School.findByIdAndDelete(id);

            return { message: 'School deleted successfully' };
        } catch (error) {
            console.error('Delete school error:', error);
            return { error: 'Failed to delete school', code: 500 };
        }
    }

    async listSchools({ page = 1, limit = 10, __shortToken }) {

        try {
            const skip = (page - 1) * limit;
            const schools = await School.find({ status: 'active' })
                .select('_id name address phone email status createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await School.countDocuments({ status: 'active' });

            return {
                schools: schools.map(school => ({
                    id: school._id,
                    name: school.name,
                    address: school.address,
                    phone: school.phone,
                    email: school.email,
                    status: school.status,
                    createdAt: school.createdAt
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('List schools error:', error);
            return { error: 'Failed to list schools', code: 500 };
        }
    }
};