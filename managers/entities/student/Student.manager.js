const Student = require('./Student.model');
const School = require('../school/School.model');
const Classroom = require('../classroom/Classroom.model');
const roles = require('../../../constants/roles');

module.exports = class StudentManager {
    constructor({ utils, cache, config, cortex, managers, validators }) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.tokenManager = managers.token;
        
        this.httpExposed = ['createStudent', 'getStudent', 'updateStudent', 'deleteStudent', 'listStudents', 'transferStudent'];
    }

    async createStudent({ firstName, lastName, email, phone, schoolId, classroomId, __shortToken }) {
        try {
            // Validate school exists
            const school = await School.findById(schoolId);
            if (!school) {
                return { error: 'School not found', code: 404 };
            }

            // Check permissions - school_admin can only create for their school
            if (__shortToken.role === roles.SCHOOL_ADMIN && __shortToken.schoolId !== schoolId) {
                return { error: 'You can only create students for your school', code: 403 };
            }

            // Validate classroom if provided
            let classroom = null;
            if (classroomId) {
                classroom = await Classroom.findById(classroomId);
                if (!classroom) {
                    return { error: 'Classroom not found', code: 404 };
                }
                if (classroom.schoolId.toString() !== schoolId) {
                    return { error: 'Classroom does not belong to the specified school', code: 400 };
                }
                // Check classroom capacity
                if (classroom.currentEnrollment >= classroom.capacity) {
                    return { error: 'Classroom is at full capacity', code: 400 };
                }
            }

            // Check if student email already exists in the school
            const existingStudent = await Student.findOne({ email, schoolId });
            if (existingStudent) {
                return { error: 'Student with this email already exists in the school', code: 400 };
            }

            // Create student
            const student = new Student({ 
                firstName, 
                lastName, 
                email, 
                phone, 
                schoolId, 
                classroomId: classroomId || null
            });
            await student.save();

            // Update classroom enrollment if assigned
            if (classroom) {
                classroom.currentEnrollment += 1;
                await classroom.save();
            }

            return {
                student: {
                    id: student._id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    fullName: student.fullName,
                    email: student.email,
                    phone: student.phone,
                    schoolId: student.schoolId,
                    classroomId: student.classroomId,
                    enrollmentDate: student.enrollmentDate,
                    status: student.status,
                    createdAt: student.createdAt
                }
            };
        } catch (error) {
            console.error('Create student error:', error);
            return { error: 'Failed to create student', code: 500 };
        }
    }

    async getStudent({ id, __shortToken }) {
        try {
            const student = await Student.findById(id)
                .populate('schoolId', 'name')
                .populate('classroomId', 'name capacity');
            
            if (!student) {
                return { error: 'Student not found', code: 404 };
            }

            // Check permissions - school_admin can only view their school's students
            if (__shortToken.role === roles.SCHOOL_ADMIN && 
                __shortToken.schoolId !== student.schoolId._id.toString()) {
                return { error: 'Access denied', code: 403 };
            }

            return {
                student: {
                    id: student._id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    fullName: student.fullName,
                    email: student.email,
                    phone: student.phone,
                    schoolId: student.schoolId._id,
                    schoolName: student.schoolId.name,
                    classroomId: student.classroomId?._id,
                    classroomName: student.classroomId?.name,
                    enrollmentDate: student.enrollmentDate,
                    status: student.status,
                    createdAt: student.createdAt,
                    updatedAt: student.updatedAt
                }
            };
        } catch (error) {
            console.error('Get student error:', error);
            return { error: 'Failed to get student', code: 500 };
        }
    }

    async updateStudent({ id, firstName, lastName, email, phone, __shortToken }) {
        try {
            const student = await Student.findById(id);
            if (!student) {
                return { error: 'Student not found', code: 404 };
            }

            // Check permissions - school_admin can only update their school's students
            if (__shortToken.role === roles.SCHOOL_ADMIN && 
                __shortToken.schoolId !== student.schoolId.toString()) {
                return { error: 'Access denied', code: 403 };
            }

            // Update fields if provided
            if (firstName) student.firstName = firstName;
            if (lastName) student.lastName = lastName;
            if (phone) student.phone = phone;
            if (email) {
                // Check if email is already taken by another student in the same school
                const existingStudent = await Student.findOne({ 
                    email, 
                    schoolId: student.schoolId, 
                    _id: { $ne: id } 
                });
                if (existingStudent) {
                    return { error: 'Email already taken by another student in this school', code: 400 };
                }
                student.email = email;
            }

            await student.save();

            return {
                student: {
                    id: student._id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    fullName: student.fullName,
                    email: student.email,
                    phone: student.phone,
                    schoolId: student.schoolId,
                    classroomId: student.classroomId,
                    enrollmentDate: student.enrollmentDate,
                    status: student.status,
                    updatedAt: student.updatedAt
                }
            };
        } catch (error) {
            console.error('Update student error:', error);
            return { error: 'Failed to update student', code: 500 };
        }
    }

    async deleteStudent({ id, __shortToken }) {
        try {
            const student = await Student.findById(id);
            if (!student) {
                return { error: 'Student not found', code: 404 };
            }

            // Check permissions - school_admin can only delete their school's students
            if (__shortToken.role === roles.SCHOOL_ADMIN && 
                __shortToken.schoolId !== student.schoolId.toString()) {
                return { error: 'Access denied', code: 403 };
            }

            // Update classroom enrollment if student was assigned
            if (student.classroomId) {
                const classroom = await Classroom.findById(student.classroomId);
                if (classroom && classroom.currentEnrollment > 0) {
                    classroom.currentEnrollment -= 1;
                    await classroom.save();
                }
            }

            await Student.findByIdAndDelete(id);

            return { message: 'Student deleted successfully' };
        } catch (error) {
            console.error('Delete student error:', error);
            return { error: 'Failed to delete student', code: 500 };
        }
    }

    async listStudents({ page = 1, limit = 10, schoolId, classroomId, status, __shortToken }) {
        try {
            const skip = (page - 1) * limit;
            let filter = {};

            // Apply school filtering based on role
            if (__shortToken.role === roles.SCHOOL_ADMIN) {
                filter.schoolId = __shortToken.schoolId;
            } else if (schoolId) {
                filter.schoolId = schoolId;
            }

            // Additional filters
            if (classroomId) filter.classroomId = classroomId;
            if (status) filter.status = status;

            const students = await Student.find(filter)
                .populate('schoolId', 'name')
                .populate('classroomId', 'name')
                .select('_id firstName lastName email phone schoolId classroomId enrollmentDate status createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Student.countDocuments(filter);

            return {
                students: students.map(student => ({
                    id: student._id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    fullName: `${student.firstName} ${student.lastName}`,
                    email: student.email,
                    phone: student.phone,
                    schoolId: student.schoolId._id,
                    schoolName: student.schoolId.name,
                    classroomId: student.classroomId?._id,
                    classroomName: student.classroomId?.name,
                    enrollmentDate: student.enrollmentDate,
                    status: student.status,
                    createdAt: student.createdAt
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('List students error:', error);
            return { error: 'Failed to list students', code: 500 };
        }
    }

    async transferStudent({ id, newClassroomId, __shortToken }) {
        try {
            const student = await Student.findById(id);
            if (!student) {
                return { error: 'Student not found', code: 404 };
            }

            // Check permissions - school_admin can only transfer their school's students
            if (__shortToken.role === roles.SCHOOL_ADMIN && 
                __shortToken.schoolId !== student.schoolId.toString()) {
                return { error: 'Access denied', code: 403 };
            }

            // Validate new classroom
            const newClassroom = await Classroom.findById(newClassroomId);
            if (!newClassroom) {
                return { error: 'New classroom not found', code: 404 };
            }

            // Check if new classroom belongs to the same school
            if (newClassroom.schoolId.toString() !== student.schoolId.toString()) {
                return { error: 'Cannot transfer student to classroom in different school', code: 400 };
            }

            // Check new classroom capacity
            if (newClassroom.currentEnrollment >= newClassroom.capacity) {
                return { error: 'New classroom is at full capacity', code: 400 };
            }

            // Update old classroom enrollment
            if (student.classroomId) {
                const oldClassroom = await Classroom.findById(student.classroomId);
                if (oldClassroom && oldClassroom.currentEnrollment > 0) {
                    oldClassroom.currentEnrollment -= 1;
                    await oldClassroom.save();
                }
            }

            // Update new classroom enrollment
            newClassroom.currentEnrollment += 1;
            await newClassroom.save();

            // Update student
            student.classroomId = newClassroomId;
            student.status = 'transferred';
            await student.save();

            return {
                student: {
                    id: student._id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    fullName: student.fullName,
                    email: student.email,
                    schoolId: student.schoolId,
                    classroomId: student.classroomId,
                    status: student.status,
                    updatedAt: student.updatedAt
                },
                message: 'Student transferred successfully'
            };
        } catch (error) {
            console.error('Transfer student error:', error);
            return { error: 'Failed to transfer student', code: 500 };
        }
    }
};