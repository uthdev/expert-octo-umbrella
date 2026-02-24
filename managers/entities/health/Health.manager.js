const mongoose = require('mongoose');

module.exports = class HealthManager {
    constructor({ config }) {
        this.config = config;
    }

    async checkHealth() {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: this.config.serviceName || 'school-management-api',
            uptime: process.uptime(),
            database: 'disconnected'
        };

        try {
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.db.admin().ping();
                health.database = 'connected';
            }
        } catch (error) {
            health.status = 'unhealthy';
            health.database = 'error';
        }

        return health;
    }
};
