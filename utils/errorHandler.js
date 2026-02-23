class ErrorHandler {
    static handleError(error, req = null) {
        console.error('Error occurred:', {
            message: error.message,
            stack: error.stack,
            url: req?.url,
            method: req?.method,
            timestamp: new Date().toISOString()
        });
    }

    static createError(message, code = 500, details = null) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }

    static formatErrorResponse(error, includeStack = false) {
        const response = {
            ok: false,
            code: error.code || 500,
            errors: error.message || 'Internal server error'
        };

        if (error.details) {
            response.details = error.details;
        }

        if (includeStack && process.env.NODE_ENV === 'development') {
            response.stack = error.stack;
        }

        return response;
    }

    static isOperationalError(error) {
        return error.code && error.code >= 400 && error.code < 500;
    }

    static handleValidationError(validationResult) {
        if (!validationResult.isValid) {
            return this.createError(
                'Validation failed',
                400,
                validationResult.errors
            );
        }
        return null;
    }

    static handleDatabaseError(error) {
        if (error.code === 11000) {
            return this.createError('Duplicate entry found', 409);
        }
        
        if (error.name === 'ValidationError') {
            return this.createError('Invalid data provided', 400, error.errors);
        }
        
        if (error.name === 'CastError') {
            return this.createError('Invalid ID format', 400);
        }
        
        return this.createError('Database operation failed', 500);
    }

    static handleAuthError(message = 'Authentication failed') {
        return this.createError(message, 401);
    }

    static handleAuthorizationError(message = 'Access denied') {
        return this.createError(message, 403);
    }

    static handleNotFoundError(resource = 'Resource') {
        return this.createError(`${resource} not found`, 404);
    }

    static handleRateLimitError() {
        return this.createError('Too many requests', 429);
    }
}

module.exports = ErrorHandler;