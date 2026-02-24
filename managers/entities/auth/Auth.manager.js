const User = require('../user/User.model');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const roles = require('../../../constants/roles');

module.exports = class Auth {
    constructor({ utils, cache, config, cortex, managers, validators }) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.tokenManager = managers.token;
        this.cache = cache;
        
        this.httpExposed = ['register', 'login', 'logout'];
    }

    async register({ email, password, firstName, lastName, phone, role = roles.SUPERADMIN }) {
        // Validation
        if (!email || !password || !firstName || !lastName) {
            return { error: 'Email, password, firstName, and lastName are required', code: 400 };
        }

        // Only allow superadmin registration through this endpoint
        // Other roles should be created by superadmin/school_admin via User manager
        if (role !== roles.SUPERADMIN) {
            return { error: 'Only superadmin registration is allowed through this endpoint', code: 400 };
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
                firstName,
                lastName,
                phone,
                schoolId: null,
                userKey: nanoid()
            });

            await user.save();

            // Generate tokens
            const longToken = this.tokenManager.genLongToken({
                userId: user._id.toString(),
                userKey: user.userKey,
                role: user.role,
                schoolId: user.schoolId
            });

            return {
                user: user.toJSON(),
                longToken
            };
        } catch (error) {
            return { error: error.message, code: 500 };
        }
    }

    async login({ email, password }) {
        // Basic validation
        if (!email || !password) {
            return { error: 'Email and password are required', code: 400 };
        }

        try {
            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                return { error: 'Invalid credentials', code: 401 };
            }

            // Check if user is active
            if (user.status !== 'active') {
                return { error: 'Account is not active', code: 403 };
            }

            // Verify password
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                return { error: 'Invalid credentials', code: 401 };
            }

            // Generate tokens
            const longToken = this.tokenManager.genLongToken({
                userId: user._id.toString(),
                userKey: user.userKey,
                role: user.role,
                schoolId: user.schoolId?.toString() || null
            });

            return {
                user: user.toJSON(),
                longToken
            };
        } catch (error) {
            return { error: error.message, code: 500 };
        }
    }

    async logout({ __token }) {
        // In a real implementation, you might blacklist the token
        // For now, just return success
        return { message: 'Logged out successfully' };
    }
};