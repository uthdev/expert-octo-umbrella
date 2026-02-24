const http              = require('http');
const express           = require('express');
const cors              = require('cors');
const swaggerUi         = require('swagger-ui-express');
const swaggerSpec       = require('../../config/swagger/swagger.config');
const restfulRoutes     = require('./restful.routes');
const app               = express();

module.exports = class UserServer {
    constructor({config, managers, mwsRepo}){
        this.config        = config;
        this.userApi       = managers.userApi;
        this.managers      = managers;
        this.mwsRepo       = mwsRepo;
    }
    
    /** for injecting middlewares */
    use(args){
        app.use(args);
    }

    /** server configs */
    run(){
        app.use(cors({origin: '*'}));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true}));
        app.use('/static', express.static('public'));

        /** Swagger documentation */
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        /** RESTful routes */
        app.use('/api', restfulRoutes({ managers: this.managers, mwsRepo: this.mwsRepo }));

        /** an error handler */
        app.use((err, req, res, next) => {
            console.error(err.stack)
            res.status(500).send('Something broke!')
        });

        let server = http.createServer(app);
        server.listen(this.config.dotEnv.USER_PORT, () => {
            console.log(`${(this.config.dotEnv.SERVICE_NAME).toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`);
        });
    }
}