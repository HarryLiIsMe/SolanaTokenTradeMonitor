import { conf } from '@/conf/conf';
import { logger } from '../logger';
import { Sequelize } from 'sequelize';
import { USDT_TOKEN_ADDR } from '@/constants';
import { getTokenPriceFromJupiter } from '@/utils/token_utils';

let db;
async function init_db() {
    // db = new Sequelize(conf.db_name, conf.db_username, conf.db_passwd, {
    //     host: conf.db_host,
    //     port: conf.db_port,
    //     dialect: 'postgres',
    // });

    // await db.authenticate();

    followed_usrs = await load_followed_usrs_from_db();
    follow_positions = await load_follow_positions_from_db();
    follow_txs = await load_follow_txs_from_db();
    followed_token_infos = await load_followed_token_info_from_db();
    // followed_user_txs = await load_followed_usrs_txs_from_db();

    logger.info('init db success');
}

async function load_followed_usrs_from_db() {
    return new Map();
}

async function load_follow_positions_from_db() {
    return new Map();
}

async function load_follow_txs_from_db() {
    return new Map();
}

async function load_followed_token_info_from_db() {
    return new Map();
}

// async function load_followed_usrs_txs_from_db() {
//     return new Map();
// }

async function updateTokenInfos() {
    for (const [tokenId, tokenInfo] of followed_token_infos) {
        const curr_tms = Math.floor(new Date().getTime() / 1000);

        if (curr_tms <= tokenInfo.last_access_tms + conf.access_interval_secs) {
            if (
                curr_tms >=
                tokenInfo.last_update_tms + conf.update_price_interval_secs
            ) {
                const [token2UsdtPrice, usdt2TokenPrice] = await Promise.all([
                    getTokenPriceFromJupiter(
                        conf.price_api,
                        [tokenId],
                        [USDT_TOKEN_ADDR],
                    ),
                    getTokenPriceFromJupiter(
                        conf.price_api,
                        [USDT_TOKEN_ADDR],
                        [tokenId],
                    ),
                ]);

                tokenInfo.token2usdt_price = token2UsdtPrice;
                tokenInfo.usdt2token_price = usdt2TokenPrice;
                tokenInfo.last_update_tms = curr_tms;

                logger.info(
                    'token price update success',
                    tokenId,
                    curr_tms,
                    tokenInfo.last_update_tms,
                    conf.update_price_interval_secs,
                    tokenInfo.last_update_tms + conf.update_price_interval_secs,
                    tokenInfo.last_access_tms,
                    conf.access_interval_secs,
                    tokenInfo.last_access_tms + conf.access_interval_secs,
                );
            }
        }
    }
}

async function queryTokenInfo(tokenId: string): Promise<[number, number]> {
    const curr_tms = Math.floor(new Date().getTime() / 1000);
    let tokenInfo = followed_token_infos.get(tokenId);
    let token2UsdtPrice: number;
    let usdt2TokenPrice: number;
    if (!tokenInfo) {
        token2UsdtPrice = await getTokenPriceFromJupiter(
            conf.price_api,
            [tokenId],
            [USDT_TOKEN_ADDR],
        );
        usdt2TokenPrice = await getTokenPriceFromJupiter(
            conf.price_api,
            [USDT_TOKEN_ADDR],
            [tokenId],
        );
        followed_token_infos.set(tokenId, {
            token_id: tokenId,
            token2usdt_price: token2UsdtPrice,
            usdt2token_price: usdt2TokenPrice,
            token_symbol: '',
            last_update_tms: curr_tms,
            last_access_tms: curr_tms,
        });
    } else {
        if (
            curr_tms >=
            tokenInfo.last_update_tms + conf.update_price_interval_secs
        ) {
            tokenInfo.token2usdt_price = await getTokenPriceFromJupiter(
                conf.price_api,
                [tokenId],
                [USDT_TOKEN_ADDR],
            );
            tokenInfo.usdt2token_price = await getTokenPriceFromJupiter(
                conf.price_api,
                [USDT_TOKEN_ADDR],
                [tokenId],
            );
            tokenInfo.last_update_tms = curr_tms;
        }
        token2UsdtPrice = tokenInfo.token2usdt_price;
        usdt2TokenPrice = tokenInfo.usdt2token_price;

        tokenInfo.last_access_tms = curr_tms;
    }

    return [token2UsdtPrice, usdt2TokenPrice];
}

type FollowedUsr = {
    account_addr: string;
    last_tx_hash: string;
    tms: number;
    block_number: number;
    is_disabled: boolean;
};

type FollowPosition = {
    followed_account_addr: string;
    token_id: string;
    amount: number;
};

type FollowTx = {
    following_tx_hash: string;
    followed_tx_hash: string;
    followed_account_addr: string;
    token_id: string;
    amount: number;
    price_usdt: number;
    // buy=true or sell=false.
    trade_direct: boolean;
    tms: number;
    block_number: number;
};

type FollowedTokenInfo = {
    token_id: string;
    token2usdt_price: number;
    usdt2token_price: number;
    token_symbol: string;
    last_update_tms: number;
    last_access_tms: number;
};

type FollowedUserTx = {
    tx_hash: string;
    followed_account_addr: string;
    token_id: string;
    amount: number;
    // price_usdt: number;
    // buy=true or sell=false.
    trade_direct: boolean;
    tms: number;
    block_number: number;
};

// key = account_addr.
let followed_usrs: Map<string, FollowedUsr> = new Map();
// key = followed_account_addr + token_id.
let follow_positions: Map<string, FollowPosition> = new Map();
// key = following_tx_hash.
let follow_txs: Map<string, FollowTx> = new Map();
// key = token_id.
let followed_token_infos: Map<string, FollowedTokenInfo> = new Map();
// key = tx_hash.
// let followed_user_txs: Map<string, FollowedUserTx> = new Map();

export {
    // follow_position,
    // followed_usr,
    // follow_tx,
    follow_positions,
    followed_usrs,
    follow_txs,
    followed_token_infos,
    // followed_user_txs,
    load_follow_txs_from_db,
    load_followed_usrs_from_db,
    load_follow_positions_from_db,
    load_followed_token_info_from_db,
    // load_followed_usrs_txs_from_db,
    queryTokenInfo,
    updateTokenInfos,
    init_db,
};
