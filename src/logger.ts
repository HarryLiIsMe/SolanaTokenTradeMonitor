import log4js from 'log4js';
let logger: log4js.Logger;

function init_logger() {
    log4js.configure({
        appenders: {
            logfile: {
                type: 'file',
                filename: 'logger.log',
            },
            console: {
                type: 'console',
            },
        },
        categories: {
            default: {
                appenders: ['logfile', 'console'],
                level: 'info',
            },
        },
    });

    logger = log4js.getLogger('follow_mgr');
}

export { logger, init_logger };
