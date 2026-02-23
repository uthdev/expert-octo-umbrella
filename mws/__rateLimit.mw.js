const rateLimit = new Map();

module.exports = ({ managers }) => {
    return ({ req, res, next }) => {
        const windowMs = process.env.RATE_LIMIT_WINDOW_MS || 900000; // 15 minutes
        const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS || 100;
        
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Get or create rate limit data for client
        if (!rateLimit.has(clientId)) {
            rateLimit.set(clientId, []);
        }
        
        const requests = rateLimit.get(clientId);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        // Check if limit exceeded
        if (validRequests.length >= maxRequests) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 429,
                errors: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
        
        // Add current request
        validRequests.push(now);
        rateLimit.set(clientId, validRequests);
        
        // Clean up old entries periodically
        if (Math.random() < 0.01) { // 1% chance
            for (const [key, timestamps] of rateLimit.entries()) {
                const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
                if (validTimestamps.length === 0) {
                    rateLimit.delete(key);
                } else {
                    rateLimit.set(key, validTimestamps);
                }
            }
        }
        
        next();
    };
};