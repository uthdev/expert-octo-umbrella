const { spawn } = require('child_process');
const http = require('http');
const seedTestUsers = require('./seed');

let serverProcess = null;

const waitForServer = (port, maxAttempts = 30) => {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkServer = () => {
            attempts++;
            
            const req = http.request({
                hostname: 'localhost',
                port: port,
                path: '/api/auth/login',
                method: 'POST',
                timeout: 1000
            }, (res) => {
                resolve();
            });

            req.on('error', () => {
                if (attempts >= maxAttempts) {
                    reject(new Error(`Server did not start after ${maxAttempts} attempts`));
                } else {
                    setTimeout(checkServer, 1000);
                }
            });

            req.on('timeout', () => {
                req.destroy();
                if (attempts >= maxAttempts) {
                    reject(new Error(`Server did not start after ${maxAttempts} attempts`));
                } else {
                    setTimeout(checkServer, 1000);
                }
            });

            req.end();
        };

        checkServer();
    });
};

module.exports = async () => {
    console.log('🌱 Seeding database with test users...');
    await seedTestUsers();
    
    console.log('Starting server for integration tests...');
    
    serverProcess = spawn('node', ['index.js'], {
        cwd: process.cwd(),
        stdio: 'ignore',
        detached: false
    });

    try {
        await waitForServer(5111);
        console.log('Server started successfully on port 5111');
        global.__SERVER_PROCESS__ = serverProcess;
    } catch (error) {
        if (serverProcess) {
            serverProcess.kill();
        }
        throw error;
    }
};
