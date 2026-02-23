const Classroom = require('./Classroom.model');
const School = require('../school/School.model');
const roles = require('../../../constants/roles');

module.exports = class ClassroomManager {
    constructor({ utils, cache, config, cortex, managers, validators }) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.tokenManager = managers.token;
        
        this.httpExposed = ['createClassroom', 'getClassroom', 'updateClassroom', 'deleteClassroom', 'listClassrooms'];
    }

    async createClassroom({ name, capacity, schoolId, resources = [], __shortToken }) {
        try {
            // Validate school exists
            const school = await School.findById(schoolId);
            if (!school) {
                return { error: 'School not found', code: 404 };
            }

            // Check permissions - superadmin can create for any school, school_admin only for their school
            if (__shortToken.role === roles.SCHOOL_ADMIN && __shortToken.schoolId !== schoolId) {
                return { error: 'You can only create classrooms for your school', code: 403 };
            }

            // Create classroom
            const classroom = new Classroom({ 
                name, 
                capacity: parseInt(capacity), 
                schoolId, 
                resources: Array.isArray(resources) ? resources : []
            });
            await classroom.save();

            return {
                classroom: {
                    id: classroom._id,
                    name: classroom.name,
                    capacity: classroom.capacity,
                    schoolId: classroom.schoolId,
                    resources: classroom.resources,
                    currentEnrollment: classroom.currentEnrollment,
                    status: classroom.status,
                    createdAt: classroom.createdAt
                }
            };
        } catch (error) {
            console.error('Create classroom error:', error);
            return { error: 'Failed to create classroom', code: 500 };
        }
    }

    async getClassroom({ id, __shortToken }) {
        try {
            const classroom = await Classroom.findById(id).populate('schoolId', 'name');
            if (!classroom) {
                return { error: 'Classroom not found', code: 404 };
            }

            // Check permissions - school_admin can only view their school's classrooms
            if (__shortToken.role === roles.SCHOOL_ADMIN && 
                __shortToken.schoolId !== classroom.schoolId._id.toString()) {
                return { error: 'Access denied', code: 403 };
            }

            return {
                classroom: {
                    id: classroom._id,
                    name: classroom.name,
                    capacity: classroom.capacity,
                    schoolId: classroom.schoolId._id,
                    schoolName: classroom.schoolId.name,
                    resources: classroom.resources,
                    currentEnrollment: classroom.currentEnrollment,
                    availableCapacity: classroom.availableCapacity,
                    status: classroom.status,
                    createdAt: classroom.createdAt,
                    updatedAt: classroom.updatedAt
                }
            };
        } catch (error) {
            console.error('Get classroom error:', error);
            return { error: 'Failed to get classroom', code: 500 };
        }
    }

    async updateClassroom({ id, name, capacity, resources, __shortToken }) {
        try {
            const classroom = await Classroom.findById(id);
            if (!classroom) {
                return { error: 'Classroom not found', code: 404 };
            }

            // Check permissions - school_admin can only update their school's classrooms
            if (__shortToken.role === roles.SCHOOL_ADMIN && 
                __shortToken.schoolId !== classroom.schoolId.toString()) {
                return { error: 'Access denied', code: 403 };
            }

            // Update fields if provided
            if (name) classroom.name = name;
            if (capacity) {
                const newCapacity = parseInt(capacity);
                // Check if new capacity is not less than current enrollment
                if (newCapacity < classroom.currentEnrollment) {
                    return { 
                        error: `Cannot reduce capacity below current enrollment (${classroom.currentEnrollment})`, 
                        code: 400 
                    };
                }
                classroom.capacity = newCapacity;
            }
            if (resources !== undefined) {
                classroom.resources = Array.isArray(resources) ? resources : [];
            }

            await classroom.save();

            return {
                classroom: {
                    id: classroom._id,
                    name: classroom.name,
                    capacity: classroom.capacity,
                    schoolId: classroom.schoolId,
                    resources: classroom.resources,
                    currentEnrollment: classroom.currentEnrollment,
                    availableCapacity: classroom.availableCapacity,
                    status: classroom.status,
                    updatedAt: classroom.updatedAt
                }
            };
        } catch (error) {
            console.error('Update classroom error:', error);
            return { error: 'Failed to update classroom', code: 500 };
        }
    }

    async deleteClassroom({ id, __shortToken }) {
        try {
            const classroom = await Classroom.findById(id);
            if (!classroom) {
                return { error: 'Classroom not found', code: 404 };
            }

            // Check permissions - school_admin can only delete their school's classrooms
            if (__shortToken.role === roles.SCHOOL_ADMIN && 
                __shortToken.schoolId !== classroom.schoolId.toString()) {
                return { error: 'Access denied', code: 403 };
            }

            // Check if classroom has students enrolled
            if (classroom.currentEnrollment > 0) {
                return { 
                    error: 'Cannot delete classroom with enrolled students', 
                    code: 400 
                };
            }

            await Classroom.findByIdAndDelete(id);

            return { message: 'Classroom deleted successfully' };
        } catch (error) {
            console.error('Delete classroom error:', error);
            return { error: 'Failed to delete classroom', code: 500 };
        }
    }

    async listClassrooms({ page = 1, limit = 10, schoolId, __shortToken }) {
        try {
            const skip = (page - 1) * limit;
            let filter = { status: 'active' };

            // Apply school filtering based on role
            if (__shortToken.role === roles.SCHOOL_ADMIN) {
                filter.schoolId = __shortToken.schoolId;
            } else if (schoolId) {
                filter.schoolId = schoolId;
            }

            const classrooms = await Classroom.find(filter)
                .populate('schoolId', 'name')
                .select('_id name capacity schoolId resources currentEnrollment status createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Classroom.countDocuments(filter);

            return {
                classrooms: classrooms.map(classroom => ({
                    id: classroom._id,
                    name: classroom.name,
                    capacity: classroom.capacity,
                    schoolId: classroom.schoolId._id,
                    schoolName: classroom.schoolId.name,
                    resources: classroom.resources,
                    currentEnrollment: classroom.currentEnrollment,
                    availableCapacity: classroom.capacity - classroom.currentEnrollment,
                    status: classroom.status,
                    createdAt: classroom.createdAt
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('List classrooms error:', error);
            return { error: 'Failed to list classrooms', code: 500 };
        }
    }
};