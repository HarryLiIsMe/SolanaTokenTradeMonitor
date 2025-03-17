import { conf } from '@/conf/conf';
import { logger } from '@/logger';

function init_timer_svr() {
    setInterval(async () => {
        logger.info('The time out');
    }, conf.timer_interval_ms);

    logger.info('init timer svr success');
}

export { init_timer_svr };
