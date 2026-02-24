const User = require('./User.model');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const roles = require('../../../constants/roles');

module.exports = class UserManager {
    constructor({ utils, cache, config, cortex, managers, validators }) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.httpExposed = [
            'createUser',
            'getUser',
            'updateUser',
            'deleteUser',
            'listUsers',
            'getProfile',
            'updateProfile'
        ];
    }

    async createUser({ email, password, role, schoolId, firstName, lastName, phone, __shortToken }) {
        // Validation
        if (!email || !password || !role || !firstName || !lastName) {
            return { error: 'Email, password, role, firstName, and lastName are required', code: 400 };
        }

        // Role-based access control
        const userRole = __shortToken?.role;
        
        // Superadmin can create any user
        if (userRole === roles.SUPERADMIN) {
            // Can create superadmin, school_admin, or student
        } 
        // School admin can only create students in their school
        else if (userRole === roles.SCHOOL_ADMIN) {
            if (role !== roles.STUDENT) {
                return { error: 'School admins can only create student accounts', code: 403 };
            }
            if (!schoolId || schoolId !== __shortToken.schoolId) {
                return { error: 'School admins can only create students in their own school', code: 403 };
            }
        } else {
            return { error: 'Insufficient permissions', code: 403 };
        }

        // Validate role
        if (![roles.SUPERADMIN, roles.SCHOOL_ADMIN, roles.STUDENT].includes(role)) {
            return { error: 'Invalid role', code: 400 };
        }

        // School admin and student must have schoolId
        if ((role === roles.SCHOOL_ADMIN || role === roles.STUDENT) && !schoolId) {
            return { error: `${role} must be assigned to a school`, code: 400 };
        }

        // Validate schoolId format if provided
        if (schoolId && !/^[0-9a-fA-F]{24}$/.test(schoolId)) {
            return { error: 'Invalid school ID format', code: 400 };
        }

        try {
            // Check if email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return { error: 'User with this email already exists', code: 400 };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = new User({
                email,
                password: hashedPassword,
                role,
                schoolId: schoolId || null,
                firstName,
                lastName,
                phone,
                userKey: nanoid()
            });

            await user.save();

            return { user: user.toJSON() };
        } catch (error) {
            return { error: error.message, code: 500 };
        }
    }

    async getUser({ id, __shortToken }) {
        // Validate ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return { error: 'Invalid user ID format', code: 400 };
        }

        try {
            const user = await User.findById(id).populate('schoolId', 'name');
            if (!user) {
                return { error: 'User not found', code: 404 };
            }

            // Access control
            const userRole = __shortToken?.role;
            if (userRole === roles.SCHOOL_ADMIN) {
                if (user.schoolId?.toString() !== __shortToken.schoolId) {
                    return { error: 'Access denied', code: 403 };
                }
            } else if (userRole === roles.STUDENT) {
                if (user._id.toString() !== __shortToken.userId) {
                    return { error: 'Access denied', code: 403 };
                }
            }

            return { user: user.toJSON() };
        } catch (error) {
            return { error: error.message, code: 500 };
        }
    }

    async updateUser({ id, email, firstName, lastName, phone, status, schoolId, __shortToken }) {
        // Validate ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return { error: 'Invalid user ID format', code: 400 };
        }

        try {
            const user = await User.findById(id);
            if (!user) {
                return { error: 'User not found', code: 404 };
            }

            // Access control
            const userRole = __shortToken?.role;
            if (userRole === roles.SCHOOL_ADMIN) {
                if (user.schoolId?.toString() !== __shortToken.schoolId) {
                    return { error: 'Access denied', code: 403 };
                }
            } else if (userRole === roles.STUDENT) {
                return { error: 'Students cannot update user records directly. Use updateProfile instead.', code: 403 };
            }

            // Update fields
            if (email) user.email = email;
            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (phone !== undefined) user.phone = phone;
            if (status) user.status = status;
            if (schoolId !== undefined) user.schoolId = schoolId;

            await user.save();

            return { user: user.toJSON() };
        } catch (error) {
            return { error: error.message, code: 500 };
        }
    }

    async deleteUser({ id, __shortToken }) {
        // Only superadmin can delete users
        if (__shortToken?.role !== roles.SUPERADMIN) {
            return { error: 'Only superadmins can delete users', code: 403 };
        }

        // Validate ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return { error: 'Invalid user ID format', code: 400 };
        }

        try {
            const user = await User.findByIdAndDelete(id);
            if (!user) {
                return { error: 'User not found', code: 404 };
            }

            return { message: 'User deleted successfully' };
        } catch (error) {
            return { error: error.message, code: 500 };
        }
    }

    async listUsers({ page = 1, limit = 10, role, schoolId, __shortToken }) {
        const userRole = __shortToken?.role;

        try {
            const query = {};

            // School admin can only see users from their school
            if (userRole === roles.SCHOOL_ADMIN) {
                query.schoolId = __shortToken.schoolId;
            } else if (userRole === roles.STUDENT) {
                return { error: 'Students cannot list users', code: 403 };
            }

            // Filter by role if provided
            if (role) {
                query.role = role;
            }

            // Filter by schoolId if provided (superadmin only)
            if (schoolId && userRole === roles.SUPERADMIN) {
                query.schoolId = schoolId;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const users = await User.find(query)
                .populate('schoolId', 'name')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });

            const total = await User.countDocuments(query);

            return {
                users: users.map(u => u.toJSON()),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            };
        } catch (error) {
            return { error: error.message, code: 500 };
        }
    }

    // Student self-service methods
    async getProfile({ __shortToken }) {
        if (!__shortToken?.userId) {
            return { error: 'Authentication required', code: 401 };
        }

        try {
            const user = await User.findById(__shortToken.userId)
                .populate('schoolId', 'name address phone email');
            
            if (!user) {
                return { error: 'User not found', code: 404 };
            }

            return { profile: user.toJSON() };
        } catch (error) {
            return { error: error.message, code: 500 };
        }
    }

    async updateProfile({ firstName, lastName, phone, __shortToken }) {
        if (!__shortToken?.userId) {
            return { error: 'Authentication required', code: 401 };
        }

        try {
            const user = await User.findById(__shortToken.userId);
            if (!user) {
                return { error: 'User not found', code: 404 };
            }

            // Update allowed fields
            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (phone !== undefined) user.phone = phone;

            await user.save();

            return { profile: user.toJSON() };
        } catch (error) {
            return { error: error.message, code: 500 };
        }
    }
};
