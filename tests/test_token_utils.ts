import { describe, it } from 'mocha';
import { assert } from 'chai';
import {
    getSol2UsdtLastFromCex,
    getSol2UsdtLastFromJupiter,
    getTokenInfo1,
    getTokenInfo2,
    getTokenPairPriceFromJupiter,
} from '../src/utils/token_utils';
import { init_conf, conf } from '../src/conf/conf';
import { init_logger, logger } from '../src/logger';
import {
    SOL_TOKEN_ADDR,
    TRUMP_TOKEN_ADDR,
    USDT_TOKEN_ADDR,
} from '../src/constants';
import { Connection } from '@solana/web3.js';

describe('test token utils', function () {
    it('test get token info', async function () {
        this.timeout(4000);

        init_logger();
        init_conf();

        const tokenInfo1 = await getTokenInfo1(
            '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
        );
        assert(
            tokenInfo1.token_info !== undefined,
            'test get token info1 failed!!!',
        );

        const conn = new Connection(conf.solana_rpc);
        const tokenInfo2 = await getTokenInfo2(
            conn,
            '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
        );
        logger.info(tokenInfo2);
        assert(tokenInfo2.decimals > 0, 'test get token info2 failed!!!');
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
