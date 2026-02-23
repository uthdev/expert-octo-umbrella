const roles = require('../constants/roles');

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

        // Add RBAC helper methods to request
        req.rbac = {
            hasRole: (role) => __shortToken.role === role,
            
            hasAnyRole: (rolesList) => rolesList.includes(__shortToken.role),
            
            hasPermission: (permission) => {
                const userPermissions = roles.PERMISSIONS[__shortToken.role] || [];
                return userPermissions.includes(permission);
            },
            
            isSuperAdmin: () => __shortToken.role === roles.SUPERADMIN,
            
            isSchoolAdmin: () => __shortToken.role === roles.SCHOOL_ADMIN,
            
            canAccessSchool: (schoolId) => {
                if (__shortToken.role === roles.SUPERADMIN) return true;
                if (__shortToken.role === roles.SCHOOL_ADMIN) {
                    return __shortToken.schoolId === schoolId;
                }
                return false;
            },
            
            requireRole: (requiredRole) => {
                if (__shortToken.role !== requiredRole) {
                    return managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        code: 403,
                        errors: `Access denied. Required role: ${requiredRole}`
                    });
                }
                return true;
            },
            
            requireAnyRole: (requiredRoles) => {
                if (!requiredRoles.includes(__shortToken.role)) {
                    return managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        code: 403,
                        errors: `Access denied. Required roles: ${requiredRoles.join(', ')}`
                    });
                }
                return true;
            },
            
            requirePermission: (permission) => {
                const userPermissions = roles.PERMISSIONS[__shortToken.role] || [];
                if (!userPermissions.includes(permission)) {
                    return managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        code: 403,
                        errors: `Access denied. Required permission: ${permission}`
                    });
                }
                return true;
            },
            
            requireSuperAdmin: () => {
                if (__shortToken.role !== roles.SUPERADMIN) {
                    return managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        code: 403,
                        errors: 'Access denied. Superadmin access required'
                    });
                }
                return true;
            },
            
            requireSchoolAccess: (schoolId) => {
                if (__shortToken.role === roles.SUPERADMIN) return true;
                
                if (__shortToken.role === roles.SCHOOL_ADMIN && __shortToken.schoolId === schoolId) {
                    return true;
                }
                
                return managers.responseDispatcher.dispatch(res, {
                    ok: false,
                    code: 403,
                    errors: 'Access denied. You can only access resources from your school'
                });
            }
        };

        next(__shortToken);
    };
};