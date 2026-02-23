const config = require('./config/index.config.js');
const ManagersLoader = require('./loaders/ManagersLoader.js');

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

// Simplified cortex object (no Redis)
const cortex = {
    sub: () => {},
    pub: () => {},
    emit: () => {},
    on: () => {}
};

const managersLoader = new ManagersLoader({ config, cache, cortex });
const managers = managersLoader.load();

managers.userServer.run();
