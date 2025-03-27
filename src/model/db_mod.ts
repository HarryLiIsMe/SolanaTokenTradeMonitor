import { conf } from '@/conf/conf';
import { logger } from '../logger';
import { Sequelize } from 'sequelize';

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

export {
    // follow_position,
    // followed_usr,
    // follow_tx,
    follow_positions,
    followed_usrs,
    follow_txs,
    load_follow_txs_from_db,
    load_followed_usrs_from_db,
    load_follow_positions_from_db,
    init_db,
};
