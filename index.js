const config = require('./config/index.config.js');
const ManagersLoader = require('./loaders/ManagersLoader.js');
const Aeon = require('aeon-machine');

process.on('uncaughtException', err => {
    console.log(`Uncaught Exception:`)
    console.log(err, err.stack);
    process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled rejection at ', promise, `reason:`, reason);
    process.exit(1)
})

// MongoDB connection
const mongoDB = config.dotEnv.MONGO_URI ? require('./connect/mongo')({
    uri: config.dotEnv.MONGO_URI
}) : null;

// Simplified cache object (no Redis)
const cache = {
    key: {
        set: async () => true,
        get: async () => null,
        delete: async () => true,
        exists: async () => false
    },
    hash: {
        set: async () => true,
        get: async () => ({}),
        setField: async () => true,
        getField: async () => null
    }
};

// Simplified oyster object (no Redis)
const oyster = {
    call: async () => null,
    get: async () => null,
    set: async () => true
};

// Simplified cortex object (no Redis)
const cortex = {
    sub: () => {},
    pub: () => {},
    emit: () => {},
    on: () => {},
    url: 'memory://localhost', // Add url property for Aeon
    prefix: 'school-mgmt'
};

const aeon = { 
    get: async () => null,
    set: async () => true,
    emit: () => {},
    on: () => {}
};

const managersLoader = new ManagersLoader({ config, cache, cortex, oyster, aeon });
const managers = managersLoader.load();

managers.userServer.run();
