const roles = require('../constants/roles');

module.exports = ({ managers }) => {
    return ({ req, res, next }) => {
        if (!req.headers.token) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false, 
                code: 401, 
                errors: 'Authentication required'
            });
        }

        const decoded = managers.token.verifyShortToken({ token: req.headers.token });
        if (!decoded) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false, 
                code: 401, 
                errors: 'Invalid or expired token'
            });
        }

        next({
            userId: decoded.userId,
            role: decoded.role,
            schoolId: decoded.schoolId,
            userKey: decoded.userKey
        });
    };
};