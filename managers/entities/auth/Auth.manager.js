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
        
        this.httpExposed = ['login', 'logout', 'createSuperAdmin'];
    }

    async login({ email, password }) {
        // Basic validation
        if (!email || !password) {
            return { error: 'Email and password are required', code: 400 };
        }

        // For demo purposes, create hardcoded users
        // In production, this would query a User model
        const users = {
            'admin@school.com': {
                id: 'superadmin_001',
                email: 'admin@school.com',
                password: await bcrypt.hash('admin123', 10),
                role: roles.SUPERADMIN,
                schoolId: null,
                userKey: 'super_key_001'
            },
            'school@demo.com': {
                id: 'school_admin_001', 
                email: 'school@demo.com',
                password: await bcrypt.hash('school123', 10),
                role: roles.SCHOOL_ADMIN,
                schoolId: null, // Will be set dynamically in tests
                userKey: 'school_key_001'
            }
        };

        const user = users[email];
        if (!user) {
            return { error: 'Invalid credentials', code: 401 };
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return { error: 'Invalid credentials', code: 401 };
        }

        // Generate tokens
        const longToken = this.tokenManager.genLongToken({
            userId: user.id,
            userKey: user.userKey,
            role: user.role,
            schoolId: user.schoolId
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId
            },
            longToken
        };
    }

    async logout({ __token }) {
        // In a real implementation, you might blacklist the token
        // For now, just return success
        return { message: 'Logged out successfully' };
    }

    async createSuperAdmin({ email, password }) {
        // This would typically be a one-time setup endpoint
        if (!email || !password) {
            return { error: 'Email and password are required', code: 400 };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = nanoid();
        const userKey = nanoid();

        // In production, save to database
        const superAdmin = {
            id: userId,
            email,
            password: hashedPassword,
            role: roles.SUPERADMIN,
            schoolId: null,
            userKey
        };

        const longToken = this.tokenManager.genLongToken({
            userId: superAdmin.id,
            userKey: superAdmin.userKey,
            role: superAdmin.role,
            schoolId: superAdmin.schoolId
        });

        return {
            user: {
                id: superAdmin.id,
                email: superAdmin.email,
                role: superAdmin.role
            },
            longToken
        };
    }
};