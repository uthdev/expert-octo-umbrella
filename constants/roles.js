module.exports = {
    SUPERADMIN: 'superadmin',
    SCHOOL_ADMIN: 'school_admin',
    
    // Role hierarchy for permission checking
    ROLE_HIERARCHY: {
        superadmin: 2,
        school_admin: 1
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
            'student:delete'
        ],
        school_admin: [
            'classroom:create',
            'classroom:read',
            'classroom:update',
            'classroom:delete',
            'student:create',
            'student:read',
            'student:update',
            'student:delete'
        ]
    }
};