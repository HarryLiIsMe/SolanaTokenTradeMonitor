import { logger } from '../logger';
import { readFileSync } from 'fs';
import z from 'zod';

let conf: Conf;

const Type1Schema = z.object({
    solana_rpc: z.string(),
    solana_rpc_with_metaplex_das_api: z.string(),
    swap_api: z.string(),
    price_api: z.string(),
    listen_port: z.number(),
    sell_min_usdt: z.number(),
    buy_max_usdt: z.number(),
    db_name: z.string(),
    db_host: z.string(),
    db_port: z.number(),
    db_username: z.string(),
    db_passwd: z.string(),
    pri_key: z.string(),
    is_simulation: z.boolean(),
    timer_interval_ms: z.number(),
    monitor_interval_ms: z.number(),
});
type Conf = z.infer<typeof Type1Schema>;

function init_conf() {
    const json_str: string = readFileSync('./misc/conf.json', 'utf-8');
    conf = Type1Schema.parse(JSON.parse(json_str));

    logger.info('init conf success');
}

export { init_conf, conf };
