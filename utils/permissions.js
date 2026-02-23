const roles = require('../constants/roles');

class PermissionsUtil {
    static hasRole(userRole, requiredRole) {
        return userRole === requiredRole;
    }

    static hasAnyRole(userRole, requiredRoles) {
        return requiredRoles.includes(userRole);
    }

    static hasPermission(userRole, permission) {
        const userPermissions = roles.PERMISSIONS[userRole] || [];
        return userPermissions.includes(permission);
    }

    static isSuperAdmin(userRole) {
        return userRole === roles.SUPERADMIN;
    }

    static isSchoolAdmin(userRole) {
        return userRole === roles.SCHOOL_ADMIN;
    }

    static canAccessSchool(userRole, userSchoolId, targetSchoolId) {
        if (userRole === roles.SUPERADMIN) return true;
        if (userRole === roles.SCHOOL_ADMIN) {
            return userSchoolId === targetSchoolId;
        }
        return false;
    }

    static getRoleHierarchyLevel(userRole) {
        return roles.ROLE_HIERARCHY[userRole] || 0;
    }

    static getPermissionsForRole(role) {
        return roles.PERMISSIONS[role] || [];
    }

    static validatePermissions(userRole, requiredPermissions) {
        const userPermissions = this.getPermissionsForRole(userRole);
        const missingPermissions = requiredPermissions.filter(
            permission => !userPermissions.includes(permission)
        );
        
        return {
            hasAccess: missingPermissions.length === 0,
            missingPermissions
        };
    }

    static createPermissionChecker(userRole, userSchoolId = null) {
        return {
            hasRole: (role) => this.hasRole(userRole, role),
            hasPermission: (permission) => this.hasPermission(userRole, permission),
            isSuperAdmin: () => this.isSuperAdmin(userRole),
            isSchoolAdmin: () => this.isSchoolAdmin(userRole),
            canAccessSchool: (schoolId) => this.canAccessSchool(userRole, userSchoolId, schoolId)
        };
    }

    // Resource-specific permission checks
    static canCreateSchool(userRole) {
        return this.hasPermission(userRole, 'school:create');
    }

    static canCreateClassroom(userRole) {
        return this.hasPermission(userRole, 'classroom:create');
    }

    static canCreateStudent(userRole) {
        return this.hasPermission(userRole, 'student:create');
    }
}

module.exports = PermissionsUtil;