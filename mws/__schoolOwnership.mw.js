const roles = require('../constants/roles');
const School = require('../managers/entities/school/School.model');
const Classroom = require('../managers/entities/classroom/Classroom.model');
const Student = require('../managers/entities/student/Student.model');

module.exports = ({ managers }) => {
    return ({ req, res, next }) => {
        const { __shortToken } = req;
        
        if (!__shortToken) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 401,
                errors: 'Authentication required'
            });
        }

        // Superadmins have access to all resources
        if (__shortToken.role === roles.SUPERADMIN) {
            return next(__shortToken);
        }

        // Add school ownership validation methods
        req.schoolOwnership = {
            validateSchoolAccess: async (schoolId) => {
                if (__shortToken.role === roles.SCHOOL_ADMIN && __shortToken.schoolId !== schoolId) {
                    return managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        code: 403,
                        errors: 'Access denied. You can only access your school resources'
                    });
                }
                return true;
            },

            validateClassroomOwnership: async (classroomId) => {
                try {
                    const classroom = await Classroom.findById(classroomId);
                    if (!classroom) {
                        return managers.responseDispatcher.dispatch(res, {
                            ok: false,
                            code: 404,
                            errors: 'Classroom not found'
                        });
                    }

                    if (__shortToken.role === roles.SCHOOL_ADMIN && 
                        __shortToken.schoolId !== classroom.schoolId.toString()) {
                        return managers.responseDispatcher.dispatch(res, {
                            ok: false,
                            code: 403,
                            errors: 'Access denied. Classroom does not belong to your school'
                        });
                    }
                    return true;
                } catch (error) {
                    return managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        code: 500,
                        errors: 'Error validating classroom ownership'
                    });
                }
            },

            validateStudentOwnership: async (studentId) => {
                try {
                    const student = await Student.findById(studentId);
                    if (!student) {
                        return managers.responseDispatcher.dispatch(res, {
                            ok: false,
                            code: 404,
                            errors: 'Student not found'
                        });
                    }

                    if (__shortToken.role === roles.SCHOOL_ADMIN && 
                        __shortToken.schoolId !== student.schoolId.toString()) {
                        return managers.responseDispatcher.dispatch(res, {
                            ok: false,
                            code: 403,
                            errors: 'Access denied. Student does not belong to your school'
                        });
                    }
                    return true;
                } catch (error) {
                    return managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        code: 500,
                        errors: 'Error validating student ownership'
                    });
                }
            },

            validateResourceOwnership: async (resourceType, resourceId) => {
                switch (resourceType) {
                    case 'school':
                        return await req.schoolOwnership.validateSchoolAccess(resourceId);
                    case 'classroom':
                        return await req.schoolOwnership.validateClassroomOwnership(resourceId);
                    case 'student':
                        return await req.schoolOwnership.validateStudentOwnership(resourceId);
                    default:
                        return managers.responseDispatcher.dispatch(res, {
                            ok: false,
                            code: 400,
                            errors: 'Invalid resource type for ownership validation'
                        });
                }
            },

            getAccessibleSchools: async () => {
                if (__shortToken.role === roles.SUPERADMIN) {
                    return await School.find({ status: 'active' }).select('_id name');
                } else if (__shortToken.role === roles.SCHOOL_ADMIN) {
                    return await School.find({ 
                        _id: __shortToken.schoolId, 
                        status: 'active' 
                    }).select('_id name');
                }
                return [];
            },

            filterBySchoolAccess: (filter = {}) => {
                if (__shortToken.role === roles.SCHOOL_ADMIN) {
                    filter.schoolId = __shortToken.schoolId;
                }
                return filter;
            }
        };

        next(__shortToken);
    };
};