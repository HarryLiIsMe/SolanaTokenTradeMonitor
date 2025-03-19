import { conf } from '@/conf/conf';
import { logger } from '@/logger';
import { follow_positions, followed_usrs } from '@/model/db_mod';
import {
    checkTransaction,
    getLastTxHashOfAccount,
    getPriorityFee,
    getTxDetails,
    getTxInfo,
    getTxRes,
} from '@/utils/tx_utils';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import sleep from 'sleep-promise';
import bs58 from 'bs58';
import {
    getSol2UsdtLastFromJupiter,
    getTokenPairPriceFromJupiter,
    getUsdt2SolLastFromJupiter,
} from '@/utils/token_utils';
import { USDT_TOKEN_ADDR } from '@/constants';

async function init_monitor_svr() {
    const conn = new Connection(conf.solana_rpc);
    const user_addr = Keypair.fromSecretKey(
        bs58.decode(conf.pri_key),
    ).publicKey.toBase58();
    // logger.info('user addr:', user_addr);
    // setInterval(async () => {
    while (true) {
        // const sol2UsdtPrice = await getSol2UsdtLastFromJupiter();
        // const usdt2SolPrice = await getUsdt2SolLastFromJupiter();
        // const sellMinPositionValueSol =
        //     conf.sell_min_position_value_usdt * usdt2SolPrice;
        // const buyMaxPositionValueSol =
        //     conf.buy_max_position_value_usdt * usdt2SolPrice;
        try {
            for (let followed_usr of [...followed_usrs.values()]) {
                if (followed_usr.is_disabled) {
                    continue;
                }
                // if (followed_usr.account_addr === user_addr) {
                //     continue;
                // }
                // logger.info('moniter addr:', followed_usr.account_addr);

                const followed_addr = new PublicKey(followed_usr.account_addr);
                const txHash = await getLastTxHashOfAccount(
                    conn,
                    followed_addr,
                );
                if (!txHash) {
                    continue;
                }
                if (txHash == followed_usr.last_tx_hash) {
                    continue;
                }

                logger.info(txHash, followed_usr.last_tx_hash);

                const txInfo = await getTxInfo(conn, txHash);
                const txRes = await getTxRes(conn, txHash);
                if (!txInfo || !txRes) {
                    logger.warn('get tx info or\\and get tx response failed');
                    continue;
                }
                const priorityFee = getPriorityFee(txInfo, txRes);
                const fee = getPriorityFee(txInfo, txRes);
                if (
                    !(await checkTransaction(
                        txInfo,
                        followed_usr.tms,
                        followed_usr.block_number,
                    ))
                ) {
                    logger.warn('check transaction failed');
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
                logger.info(txDetails);

                const solBalanceChangeWithoutSomeFee =
                    txDetails.solBalanceChange - fee - priorityFee;
                const tokenAmount = txDetails.tokenAmount;
                if (tokenAmount == 0) {
                    logger.error('tokenAmount err:', tokenAmount);
                    continue;
                }

                const follow_position = follow_positions.get(
                    followed_usr.account_addr + txDetails.tokenId,
                );
                const usdt2TokenIdPrice = await getTokenPairPriceFromJupiter(
                    conf.price_api,
                    USDT_TOKEN_ADDR,
                    txDetails.tokenId,
                );
                const buyMaxPositionValueTokenId =
                    conf.buy_max_position_value_usdt * usdt2TokenIdPrice;
                const sellMinPositionValueTokenId =
                    conf.sell_min_position_value_usdt * usdt2TokenIdPrice;

                if (!follow_position) {
                    if (txDetails.tradeDirect == 'sell') {
                        continue;
                    }

                    let newAmount = 0;

                    if (tokenAmount <= buyMaxPositionValueTokenId) {
                        newAmount = tokenAmount;
                    } else {
                        newAmount = buyMaxPositionValueTokenId;
                    }

                    follow_positions.set(
                        followed_usr.account_addr + txDetails.tokenId,
                        {
                            followed_account_addr: followed_usr.account_addr,
                            token_id: txDetails.tokenId,
                            amount: newAmount,
                        },
                    );
                } else {
                    if (txDetails.tradeDirect == 'sell') {
                        if (
                            txDetails.preTokenAmount == 0 ||
                            txDetails.preTokenAmount <= txDetails.tokenAmount
                        ) {
                            logger.error(
                                'preTokenAmount err:',
                                txDetails.preTokenAmount,
                            );
                            continue;
                        }

                        const sellAmount =
                            (follow_position.amount * txDetails.tokenAmount) /
                            txDetails.preTokenAmount;
                        if (sellAmount <= sellMinPositionValueTokenId) {
                            continue;
                        }
                        follow_position.amount =
                            follow_position.amount - sellAmount;
                    } else {
                        const newAmount = follow_position.amount + tokenAmount;
                        if (newAmount <= buyMaxPositionValueTokenId) {
                            follow_position.amount = newAmount;
                        } else {
                            follow_position.amount = buyMaxPositionValueTokenId;
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
