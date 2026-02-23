module.exports = ({ managers }) => {
    return ({ req, res, next }) => {
        
        const sanitizeString = (str) => {
            if (typeof str !== 'string') return str;
            
            return str
                .trim()
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/on\w+\s*=/gi, '') // Remove event handlers
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#x27;/g, "'");
        };
        
        const sanitizeObject = (obj) => {
            if (obj === null || obj === undefined) return obj;
            
            if (typeof obj === 'string') {
                return sanitizeString(obj);
            }
            
            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }
            
            if (typeof obj === 'object') {
                const sanitized = {};
                for (const [key, value] of Object.entries(obj)) {
                    // Skip middleware-specific properties
                    if (key.startsWith('__')) {
                        sanitized[key] = value;
                    } else {
                        sanitized[key] = sanitizeObject(value);
                    }
                }
                return sanitized;
            }
            
            return obj;
        };
        
        // Sanitize request body
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        
        // Sanitize query parameters
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        
        // Sanitize URL parameters
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }
        
        next();
    };
};