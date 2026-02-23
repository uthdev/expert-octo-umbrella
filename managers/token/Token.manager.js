const jwt        = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const md5        = require('md5');
const roles      = require('../../constants/roles');

module.exports = class TokenManager {

    constructor({config}){
        this.config              = config;
        this.longTokenExpiresIn  = '7d';
        this.shortTokenExpiresIn = '1h';

        this.httpExposed         = ['v1_createShortToken'];
    }

    genLongToken({userId, userKey, role, schoolId}){
        return jwt.sign(
            { 
                userKey, 
                userId,
                role,
                schoolId
            }, 
            this.config.dotEnv.LONG_TOKEN_SECRET, 
            {expiresIn: this.longTokenExpiresIn
        })
    }

    genShortToken({userId, userKey, sessionId, deviceId, role, schoolId}){
        return jwt.sign(
            { userKey, userId, sessionId, deviceId, role, schoolId}, 
            this.config.dotEnv.SHORT_TOKEN_SECRET, 
            {expiresIn: this.shortTokenExpiresIn
        })
    }

    _verifyToken({token, secret}){
        let decoded = null;
        try {
            decoded = jwt.verify(token, secret);
        } catch(err) { console.log(err); }
        return decoded;
    }

    verifyLongToken({token}){
        return this._verifyToken({token, secret: this.config.dotEnv.LONG_TOKEN_SECRET,})
    }
    verifyShortToken({token}){
        return this._verifyToken({token, secret: this.config.dotEnv.SHORT_TOKEN_SECRET,})
    }

    hasPermission({role, permission}){
        const userPermissions = roles.PERMISSIONS[role] || [];
        return userPermissions.includes(permission);
    }

    v1_createShortToken({__longToken, __device}){
        let decoded = __longToken;
        console.log(decoded);
        
        let shortToken = this.genShortToken({
            userId: decoded.userId, 
            userKey: decoded.userKey,
            sessionId: nanoid(),
            deviceId: md5(__device),
            role: decoded.role,
            schoolId: decoded.schoolId
        });

        return { shortToken };
    }
}