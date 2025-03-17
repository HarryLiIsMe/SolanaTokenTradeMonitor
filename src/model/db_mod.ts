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

    logger.info('init db success');
}

async function load_followed_usrs_from_db() {
    return new Map();
}

async function load_follow_positions_from_db() {
    return new Map();
}

class followed_usr {
    constructor() {
        this.account_addr = '';
        this.last_tx_hash = '';
        this.tms = 1;
        this.block_number = 1;
        this.is_disabled = false;
    }

    account_addr: string;
    last_tx_hash: string;
    tms: number;
    block_number: number;
    is_disabled: boolean;
}

class follow_position {
    constructor() {
        this.followed_account_addr = '';
        this.token_id = '';
        this.amount = 0;
    }

    followed_account_addr: string;
    token_id: string;
    amount: number;
}

let followed_usrs: Map<string, followed_usr> = new Map();
// key = followed_account_addr + token_id
let follow_positions: Map<string, follow_position> = new Map();

export {
    follow_position,
    followed_usr,
    follow_positions,
    followed_usrs,
    init_db,
};
