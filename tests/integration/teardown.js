module.exports = async () => {
    console.log('Stopping server...');
    
    const serverProcess = global.__SERVER_PROCESS__;
    
    if (serverProcess) {
        serverProcess.kill();
        
        // Wait a bit for the process to terminate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Server stopped');
    }
};
