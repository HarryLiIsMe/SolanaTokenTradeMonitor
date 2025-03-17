import { conf } from '@/conf/conf';
import { logger } from '@/logger';
import { router } from '@/router/router';
import express from 'express';

let app;
function init_web_svr() {
    app = express();
    app.use(router);

    app.listen(conf.listen_port);
    logger.info('init web svr success');

    logger.info('app listening on port', conf.listen_port);
}

export { init_web_svr };
