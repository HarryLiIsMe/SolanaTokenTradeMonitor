import { PublicKey } from '@solana/web3.js';
import { logger } from '../logger';
import express, { Request, Response } from 'express';
import bs58 from 'bs58';
import {
    follow_positions,
    follow_txs,
    followed_user_txs,
    followed_usrs,
} from '@/model/db_mod';

export { folllow_mgr_router };

const folllow_mgr_router = express.Router();

folllow_mgr_router.get('/add_followed_addr/:addr', add_followed_addr);
folllow_mgr_router.get('/del_followed_addr/:addr', del_followed_addr);
folllow_mgr_router.get('/list_followed_users', list_followed_users);
folllow_mgr_router.get('/list_follow_positions', list_follow_positions);
folllow_mgr_router.get('/list_follow_txs', list_follow_txs);

function add_followed_addr(req: Request, res: Response) {
    allowCORS(res);

    const followed_addr = req.params.addr;
    logger.info('add followed addr:', followed_addr);

    if (isValidSolanaAddress(followed_addr)) {
        let follow_user = followed_usrs.get(followed_addr);
        if (!follow_user) {
            follow_user = {
                account_addr: followed_addr,
                last_tx_hash: '11111111',
                tms: 1,
                block_number: 1,
                is_disabled: false,
            };
            followed_usrs.set(followed_addr, follow_user);
            res.send('add success');
        } else if (follow_user.is_disabled) {
            follow_user.is_disabled = false;
            res.send('add success');
        } else {
            res.status(201).send('add follow address already exist');
        }
    } else {
        res.status(201).send('addr validate failed');
    }
}

function del_followed_addr(req: Request, res: Response) {
    allowCORS(res);

    const followed_addr = req.params.addr;
    logger.info('del followed addr:', followed_addr);

    if (isValidSolanaAddress(followed_addr)) {
        let follow_user = followed_usrs.get(followed_addr);
        if (follow_user && !follow_user.is_disabled) {
            follow_user.is_disabled = true;

            res.send('del success');
        } else if (follow_user && follow_user.is_disabled) {
            res.status(201).send('del follow address already is disable');
        } else {
            res.status(201).send('del follow address not exist');
        }
    } else {
        res.status(201).send('addr validate failed');
    }
}

type FollowedUser = {
    total_buy_amount: number;
    total_sell_amount: number;
    buy_num: number;
    sell_num: number;
    total_profit: number;
    token_trade_info: Map<
        string,
        {
            total_buy_amount: number;
            total_sell_amount: number;
            buy_token_amount: number;
            sell_token_amount: number;
        }
    >;
};

async function list_followed_users(req: Request, res: Response) {
    allowCORS(res);
    const usrTxs = new Map<string, FollowedUser>();
    follow_txs.forEach((tx) => {
        const userTxInfo = usrTxs.get(tx.followed_account_addr);

        if (userTxInfo) {
            const tokenTradeInfo = userTxInfo.token_trade_info.get(tx.token_id);
            if (tx.trade_direct) {
                userTxInfo.buy_num += 1;
                userTxInfo.total_buy_amount += tx.amount * tx.price_usdt;
                if (tokenTradeInfo) {
                    tokenTradeInfo.total_buy_amount +=
                        tx.amount * tx.price_usdt;
                    tokenTradeInfo.buy_token_amount += tx.amount;
                } else {
                    userTxInfo.token_trade_info.set(tx.token_id, {
                        total_buy_amount: tx.amount * tx.price_usdt,
                        total_sell_amount: 0,
                        buy_token_amount: tx.amount,
                        sell_token_amount: 0,
                    });
                }
            } else {
                userTxInfo.sell_num += 1;
                userTxInfo.total_sell_amount += tx.amount * tx.price_usdt;
                if (tokenTradeInfo) {
                    tokenTradeInfo.total_sell_amount +=
                        tx.amount * tx.price_usdt;
                    tokenTradeInfo.sell_token_amount += tx.amount;
                } else {
                    userTxInfo.token_trade_info.set(tx.token_id, {
                        total_buy_amount: 0,
                        total_sell_amount: tx.amount * tx.price_usdt,
                        buy_token_amount: 0,
                        sell_token_amount: tx.amount,
                    });
                }
            }
        } else {
            const txInfo: FollowedUser = {
                total_buy_amount: 0,
                total_sell_amount: 0,
                buy_num: 0,
                sell_num: 0,
                total_profit: 0,
                token_trade_info: new Map(),
            };
            if (tx.trade_direct) {
                txInfo.total_buy_amount = tx.amount * tx.price_usdt;
                txInfo.buy_num = 1;
                txInfo.token_trade_info.set(tx.token_id, {
                    total_buy_amount: tx.amount * tx.price_usdt,
                    total_sell_amount: 0,
                    buy_token_amount: tx.amount,
                    sell_token_amount: 0,
                });
            } else {
                txInfo.total_sell_amount = tx.amount * tx.price_usdt;
                txInfo.sell_num = 1;
                txInfo.token_trade_info.set(tx.token_id, {
                    total_buy_amount: 0,
                    total_sell_amount: tx.amount * tx.price_usdt,
                    buy_token_amount: 0,
                    sell_token_amount: tx.amount,
                });
            }
            usrTxs.set(tx.followed_account_addr, txInfo);
        }
    });
    usrTxs.forEach((usrTx) => {
        usrTx.token_trade_info.forEach((tokenTradeInfo) => {
            const diff_amount =
                tokenTradeInfo.total_sell_amount -
                (tokenTradeInfo.total_buy_amount *
                    tokenTradeInfo.sell_token_amount) /
                    tokenTradeInfo.buy_token_amount;

            usrTx.total_profit += diff_amount;
        });
    });

    const followeds = {
        followed_usrs: [
            ...followed_usrs.values().map((v) => {
                const userTxInfo = usrTxs.get(v.account_addr);
                if (!userTxInfo) {
                    return {
                        account_addr: v.account_addr,
                        is_disabled: v.is_disabled,
                        tms: 1,
                        total_buy_amount: 0,
                        total_sell_amount: 0,
                        buy_num: 0,
                        sell_num: 0,
                        total_profit: 0,
                    };
                } else {
                    return {
                        account_addr: v.account_addr,
                        is_disabled: v.is_disabled,
                        tms: 1,
                        total_buy_amount: userTxInfo.total_buy_amount,
                        total_sell_amount: userTxInfo.total_sell_amount,
                        buy_num: userTxInfo.buy_num,
                        sell_num: userTxInfo.sell_num,
                        total_profit: userTxInfo.total_profit,
                    };
                }
            }),
        ],
    };

    res.send(JSON.stringify(followeds));
}

function list_follow_positions(req: Request, res: Response) {
    allowCORS(res);

    const followeds = {
        follow_positions: [...follow_positions.values()],
    };

    res.send(JSON.stringify(followeds));
}

function list_follow_txs(req: Request, res: Response) {
    allowCORS(res);

    const followeds = {
        follow_txs: [...follow_txs.values()],
    };

    res.send(JSON.stringify(followeds));
}

function isValidSolanaAddress(address: string): boolean {
    try {
        if (address.length < 32 || address.length > 44) {
            return false;
        }
        const decoded = bs58.decode(address);
        if (decoded.length !== 32) {
            return false;
        }

        return PublicKey.isOnCurve(decoded);
    } catch (error) {
        return false;
    }
}

function allowCORS(res: Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'PUT,POST,GET,DELETE,OPTIONS',
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Content-Type', 'application/json');
}
