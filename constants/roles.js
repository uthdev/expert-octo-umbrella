module.exports = {
    SUPERADMIN: 'superadmin',
    SCHOOL_ADMIN: 'school_admin',
    STUDENT: 'student',
    
    // Role hierarchy for permission checking
    ROLE_HIERARCHY: {
        superadmin: 3,
        school_admin: 2,
        student: 1
    },
    
    // Permissions mapping
    PERMISSIONS: {
        superadmin: [
            'school:create',
            'school:read',
            'school:update', 
            'school:delete',
            'classroom:create',
            'classroom:read',
            'classroom:update',
            'classroom:delete',
            'student:create',
            'student:read',
            'student:update',
            'student:delete',
            'user:create',
            'user:read',
            'user:update',
            'user:delete'
        ],
        school_admin: [
            'classroom:create',
            'classroom:read',
            'classroom:update',
            'classroom:delete',
            'student:create',
            'student:read',
            'student:update',
            'student:delete',
            'user:create',
            'user:read'
        ],
        student: [
            'profile:read',
            'profile:update',
            'classroom:read'
        ]
    }
};