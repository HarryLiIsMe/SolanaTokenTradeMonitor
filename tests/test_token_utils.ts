import { describe, it } from 'mocha';
import { assert } from 'chai';
import {
    getSol2UsdtLastFromCex,
    getSol2UsdtLastFromJupiter,
    getTokenInfo,
    getTokenPairPriceFromJupiter,
} from '../src/utils/token_utils';
import { init_conf, conf } from '../src/conf/conf';
import { init_logger, logger } from '../src/logger';
import {
    SOL_TOKEN_ADDR,
    TRUMP_TOKEN_ADDR,
    USDT_TOKEN_ADDR,
} from '../src/constants';

describe('test token utils', function () {
    it('test get token info', async function () {
        this.timeout(2000);

        init_logger();
        init_conf();

        const tokenInfo = await getTokenInfo(
            '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
        );
        assert(
            tokenInfo.token_info !== undefined,
            'test get token info failed!!!',
        );
    });

    it('test get sol to usdt last from cex', async function () {
        this.timeout(5000);

        init_logger();
        init_conf();

        const sol2Usdt = await getSol2UsdtLastFromCex();
        assert(sol2Usdt !== undefined, 'test get token info failed!!!');

        logger.info(sol2Usdt);
    });

    it('test get sol to usdt last from jupiter', async function () {
        this.timeout(5000);

        init_logger();
        init_conf();

        const sol2Usdt = await getSol2UsdtLastFromJupiter();

        logger.info(sol2Usdt);
    });

    it('test get token pair price from jupiter', async function () {
        this.timeout(5000);

        init_logger();
        init_conf();

        let price = await getTokenPairPriceFromJupiter(
            conf.price_api,
            USDT_TOKEN_ADDR,
            SOL_TOKEN_ADDR,
        );

        price = await getTokenPairPriceFromJupiter(
            conf.price_api,
            USDT_TOKEN_ADDR,
            SOL_TOKEN_ADDR,
        );

        price = await getTokenPairPriceFromJupiter(
            conf.price_api,
            TRUMP_TOKEN_ADDR,
            SOL_TOKEN_ADDR,
        );

        price = await getTokenPairPriceFromJupiter(
            conf.price_api,
            TRUMP_TOKEN_ADDR,
            USDT_TOKEN_ADDR,
        );

        logger.info(price);
    });
});
