import { conf } from '@/conf/conf';
import { USDT_TOKEN_ADDR } from '@/constants';
import { logger } from '@/logger';
import { followed_token_infos, updateTokenInfos } from '@/model/db_mod';
import { getTokenPriceFromJupiter } from '@/utils/token_utils';
import { log } from 'console';

async function init_timer_svr() {
    // await update_token_prices();
    setInterval(async () => {
        try {
            await updateTokenInfos();
        } catch (e) {
            logger.error('updateTokenInfos error: ', e);
        }
    }, conf.update_price_interval_secs * 1000);

    logger.info('init timer svr success');
}

// async function update_token_prices() {
//     // for (const [tokenId, tokenInfo] of followed_token_info) {
//     //     const curr_tms = Math.floor(new Date().getTime() / 1000);
//     //     if (
//     //         curr_tms >
//     //         tokenInfo.last_update_tms + conf.update_price_interval_secs
//     //     ) {
//     //         const token2UsdtPrice = await getTokenPriceFromJupiter(
//     //             conf.price_api,
//     //             [tokenId],
//     //             [USDT_TOKEN_ADDR],
//     //         );
//     //         const usdt2TokenPrice = await getTokenPriceFromJupiter(
//     //             conf.price_api,
//     //             [USDT_TOKEN_ADDR],
//     //             [tokenId],
//     //         );

//     //         tokenInfo.token2usdt_price = token2UsdtPrice;
//     //         tokenInfo.usdt2token_price = usdt2TokenPrice;
//     //         tokenInfo.last_update_tms = curr_tms;

//     //         // logger.info('token price update success');
//     //     }
//     // }
//     // // logger.info('price update success');
// }

export { init_timer_svr };
