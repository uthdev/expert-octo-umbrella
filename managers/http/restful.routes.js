const express = require('express');

module.exports = ({ managers, mwsRepo }) => {
    const router = express.Router();

    // Middleware to extract token from Authorization header
    const extractToken = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            req.headers.token = authHeader.replace('Bearer ', '');
        }
        next();
    };

    router.use(extractToken);
    const verifyShortToken = async (req, res, next) => {
        if (!req.headers.token) {
            return managers.responseDispatcher.dispatch(res, { ok: false, error: 'unauthorized', code: 401 });
        }
        try {
            const decoded = managers.token.verifyShortToken({ token: req.headers.token });
            if (!decoded) {
                return managers.responseDispatcher.dispatch(res, { ok: false, error: 'unauthorized', code: 401 });
            }
            req.__shortToken = decoded;
            next();
        } catch (err) {
            return managers.responseDispatcher.dispatch(res, { ok: false, error: 'unauthorized', code: 401 });
        }
    };

    const verifyLongToken = async (req, res, next) => {
        if (!req.headers.token) {
            return managers.responseDispatcher.dispatch(res, { ok: false, error: 'unauthorized', code: 401 });
        }
        try {
            const decoded = managers.token.verifyLongToken({ token: req.headers.token });
            if (!decoded) {
                return managers.responseDispatcher.dispatch(res, { ok: false, error: 'unauthorized', code: 401 });
            }
            req.__longToken = decoded;
            next();
        } catch (err) {
            return managers.responseDispatcher.dispatch(res, { ok: false, error: 'unauthorized', code: 401 });
        }
    };

    // Helper to format response like Axion API
    const formatResponse = (result) => {
        if (result.error) {
            return { ok: false, error: result.error, errors: result.errors, code: result.code || 400 };
        }
        return { ok: true, data: result, code: 200 };
    };

    // ==================== Authentication ====================
    router.post('/auth/login', async (req, res) => {
        const result = await managers.auth.login(req.body);
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.post('/auth/logout', verifyShortToken, async (req, res) => {
        const result = await managers.auth.logout({ __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.post('/token/create', verifyLongToken, async (req, res) => {
        const result = await managers.token.v1_createShortToken({ 
            __longToken: req.__longToken,
            __device: req.headers.device || 'unknown'
        });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    // ==================== Schools (RESTful) ====================
    router.post('/schools', verifyShortToken, async (req, res) => {
        const result = await managers.school.createSchool({ ...req.body, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.get('/schools', verifyShortToken, async (req, res) => {
        const result = await managers.school.listSchools({ ...req.query, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.get('/schools/:id', verifyShortToken, async (req, res) => {
        const result = await managers.school.getSchool({ id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.put('/schools/:id', verifyShortToken, async (req, res) => {
        const result = await managers.school.updateSchool({ ...req.body, id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.delete('/schools/:id', verifyShortToken, async (req, res) => {
        const result = await managers.school.deleteSchool({ id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    // ==================== Classrooms (RESTful) ====================
    router.post('/classrooms', verifyShortToken, async (req, res) => {
        const result = await managers.classroom.createClassroom({ ...req.body, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.get('/classrooms', verifyShortToken, async (req, res) => {
        const result = await managers.classroom.listClassrooms({ ...req.query, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.get('/classrooms/:id', verifyShortToken, async (req, res) => {
        const result = await managers.classroom.getClassroom({ id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.put('/classrooms/:id', verifyShortToken, async (req, res) => {
        const result = await managers.classroom.updateClassroom({ ...req.body, id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.delete('/classrooms/:id', verifyShortToken, async (req, res) => {
        const result = await managers.classroom.deleteClassroom({ id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    // ==================== Students (RESTful) ====================
    router.post('/students', verifyShortToken, async (req, res) => {
        const result = await managers.student.createStudent({ ...req.body, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.get('/students', verifyShortToken, async (req, res) => {
        const result = await managers.student.listStudents({ ...req.query, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.get('/students/:id', verifyShortToken, async (req, res) => {
        const result = await managers.student.getStudent({ id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.put('/students/:id', verifyShortToken, async (req, res) => {
        const result = await managers.student.updateStudent({ ...req.body, id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.delete('/students/:id', verifyShortToken, async (req, res) => {
        const result = await managers.student.deleteStudent({ id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    router.post('/students/:id/transfer', verifyShortToken, async (req, res) => {
        const result = await managers.student.transferStudent({ ...req.body, id: req.params.id, __shortToken: req.__shortToken });
        return managers.responseDispatcher.dispatch(res, formatResponse(result));
    });

    return router;
};
