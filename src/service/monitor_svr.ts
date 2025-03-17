import { conf } from '@/conf/conf';
import { logger } from '@/logger';
import { follow_positions, followed_usrs } from '@/model/db_mod';
import {
    checkTransaction,
    getLastTxHashOfAccount,
    getTxDetails,
    getTxInfo,
    getTxRes,
} from '@/utils/tx_utils';
import { Connection, PublicKey } from '@solana/web3.js';
import { log } from 'console';
import sleep from 'sleep-promise';

async function init_monitor_svr() {
    const conn = new Connection(conf.solana_rpc);
    // setInterval(async () => {
    while (true) {
        try {
            for (let followed_usr of [...followed_usrs.values()]) {
                if (followed_usr.is_disabled) {
                    continue;
                }

                logger.info('moniter addr:', followed_usr.account_addr);

                const followed_addr = new PublicKey(followed_usr.account_addr);
                const txHash = await getLastTxHashOfAccount(
                    conn,
                    followed_addr,
                );
                if (!txHash) {
                    continue;
                }
                const txInfo = await getTxInfo(conn, txHash);
                const txRes = await getTxRes(conn, txHash);
                if (!txInfo || !txRes) {
                    continue;
                }
                if (txHash == followed_usr.last_tx_hash) {
                    continue;
                }
                if (
                    !(await checkTransaction(
                        txInfo,
                        followed_usr.tms,
                        followed_usr.block_number,
                    ))
                ) {
                    continue;
                }
                followed_usr.tms = txInfo.blockTime!;
                followed_usr.block_number = txInfo.slot;
                followed_usr.last_tx_hash = txHash;

                const txDetails = await getTxDetails(
                    followed_addr,
                    txInfo,
                    txRes,
                );
                if (!txDetails) {
                    continue;
                }

                if (txDetails.tokenAmount == 0) {
                    logger.error('tokenAmount err:', txDetails.tokenAmount);
                    continue;
                }

                const follow_position = follow_positions.get(
                    followed_usr.account_addr + txDetails.tokenId,
                );

                if (!follow_position) {
                    if (txDetails.tradeDirect == 'sell') {
                        continue;
                    }
                    follow_positions.set(
                        followed_usr.account_addr + txDetails.tokenId,
                        {
                            followed_account_addr: followed_usr.account_addr,
                            token_id: txDetails.tokenId,
                            amount:
                                txDetails.tokenAmount > conf.buy_max_usdt
                                    ? conf.buy_max_usdt
                                    : txDetails.tokenAmount,
                        },
                    );
                } else {
                    if (txDetails.tradeDirect == 'sell') {
                        if (txDetails.preTokenAmount == 0) {
                            logger.error(
                                'preTokenAmount err:',
                                txDetails.preTokenAmount,
                            );
                            continue;
                        }

                        const newAmount =
                            (follow_position.amount * txDetails.tokenAmount) /
                            txDetails.preTokenAmount;
                        follow_position.amount = newAmount;
                    } else {
                        const newAmount =
                            follow_position.amount + txDetails.tokenAmount;
                        if (newAmount <= conf.buy_max_usdt) {
                            follow_position.amount = newAmount;
                        } else {
                            follow_position.amount = conf.buy_max_usdt;
                        }
                    }
                }
            }
            await sleep(200);
        } catch (e) {
            logger.error('init_monitor_svr', e);
        }
    }

    // }, 1000);
}

export { init_monitor_svr };
