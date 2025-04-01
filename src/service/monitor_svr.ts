import { conf } from '@/conf/conf';
import { logger } from '@/logger';
import { follow_positions, follow_txs, followed_usrs } from '@/model/db_mod';
import {
    checkTransaction,
    getLastTxHashOfAccount,
    getPriorityFee,
    getTradeToken,
    getTxDetails,
    getTxDetails2,
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
import { v4 as uuid } from 'uuid';
import { log } from 'console';

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

                // logger.info(txHash, followed_usr.last_tx_hash);

                const txInfo = await getTxInfo(conn, txHash);
                const txRes = await getTxRes(conn, txHash);
                if (!txInfo || !txRes) {
                    logger.warn(
                        'get tx info or\\and get tx response failed:',
                        txHash,
                    );
                    continue;
                }
                if (
                    !(await checkTransaction(
                        txInfo,
                        followed_usr.tms,
                        followed_usr.block_number,
                    ))
                ) {
                    logger.warn('check transaction failed:', txHash);
                    continue;
                }
                followed_usr.tms = txInfo.blockTime!;
                followed_usr.block_number = txInfo.slot;
                followed_usr.last_tx_hash = txHash;

                const txDetails = await getTxDetails2(
                    followed_addr,
                    txInfo,
                    txRes,
                );
                if (!txDetails) {
                    logger.warn('getTxDetails failed:', txHash);
                    continue;
                }
                // logger.info(txDetails);

                const priorityFee = getPriorityFee(txInfo, txRes);
                const fee = getPriorityFee(txInfo, txRes);

                const txTradeInfo = getTradeToken(txDetails, fee, priorityFee);
                if (!txTradeInfo) {
                    logger.warn('getTradeToken failed:', txHash);
                    continue;
                }
                logger.info(txTradeInfo);

                // const solBalanceChangeWithoutSomeFee =
                //     txDetails.solBalanceChange - fee - priorityFee;
                // const tokenAmount = txDetails.tokenAmount;
                // if (tokenAmount == 0) {
                //     logger.error('tokenAmount err:', tokenAmount);
                //     continue;
                // }

                const tradeTokenId =
                    txTradeInfo.tradeDirect == 'buy'
                        ? txTradeInfo.outToken.tokenId
                        : txTradeInfo.inToken.tokenId;
                const tokenAmount = Math.abs(
                    txTradeInfo.tradeDirect == 'buy'
                        ? txTradeInfo.outToken.amount
                        : txTradeInfo.inToken.amount,
                );
                const preTokenAmount = Math.abs(
                    txTradeInfo.tradeDirect == 'buy'
                        ? txTradeInfo.outToken.preTokenAmount
                        : txTradeInfo.inToken.preTokenAmount,
                );

                const follow_position = follow_positions.get(
                    followed_usr.account_addr + tradeTokenId,
                );
                const usdt2TokenIdPrice = await getTokenPairPriceFromJupiter(
                    conf.price_api,
                    USDT_TOKEN_ADDR,
                    tradeTokenId,
                );
                const buyMaxPositionValueTokenId =
                    conf.buy_max_position_value_usdt * usdt2TokenIdPrice;
                const sellMinPositionValueTokenId =
                    conf.sell_min_position_value_usdt * usdt2TokenIdPrice;

                if (!follow_position) {
                    if (txTradeInfo.tradeDirect == 'sell') {
                        logger.warn('sell empty posiotion');
                        continue;
                    }

                    let newAmount = 0;
                    if (tokenAmount <= buyMaxPositionValueTokenId) {
                        newAmount = tokenAmount;
                    } else {
                        newAmount = buyMaxPositionValueTokenId;
                    }

                    logger.info('buy create position: ', newAmount);
                    const follow_tx_hash = uuid();
                    follow_txs.set(follow_tx_hash, {
                        following_tx_hash: follow_tx_hash,
                        followed_tx_hash: txHash,
                        followed_account_addr: followed_addr.toBase58(),
                        token_id: tradeTokenId,
                        // token_symbol: '',
                        amount: newAmount,
                        trade_direct: true,
                        tms: Math.floor(Date.now() / 1000),
                        block_number: txInfo.blockTime! + 1,
                    });

                    follow_positions.set(
                        followed_usr.account_addr + tradeTokenId,
                        {
                            followed_account_addr: followed_usr.account_addr,
                            token_id: tradeTokenId,
                            amount: newAmount,
                        },
                    );
                } else {
                    if (txTradeInfo.tradeDirect == 'sell') {
                        if (
                            preTokenAmount == 0 ||
                            preTokenAmount <= tokenAmount
                        ) {
                            logger.error('preTokenAmount err:', preTokenAmount);
                            continue;
                        }

                        const sellAmount =
                            (follow_position.amount * tokenAmount) /
                            preTokenAmount;
                        if (sellAmount <= sellMinPositionValueTokenId) {
                            logger.warn(
                                'less than sell min position value tokenId',
                            );
                            continue;
                        }
                        logger.info('sell position: ', sellAmount);
                        const follow_tx_hash = uuid();
                        follow_txs.set(follow_tx_hash, {
                            following_tx_hash: follow_tx_hash,
                            followed_tx_hash: txHash,
                            followed_account_addr: followed_addr.toBase58(),
                            token_id: tradeTokenId,
                            // token_symbol: '',
                            amount: sellAmount,
                            trade_direct: false,
                            tms: Math.floor(Date.now() / 1000),
                            block_number: txInfo.blockTime! + 1,
                        });

                        follow_position.amount =
                            follow_position.amount - sellAmount;
                    } else {
                        if (
                            follow_position.amount >= buyMaxPositionValueTokenId
                        ) {
                            logger.warn(
                                'greater than buy max position value tokenId',
                            );
                            continue;
                        }

                        const newAmount = follow_position.amount + tokenAmount;
                        if (newAmount <= buyMaxPositionValueTokenId) {
                            follow_position.amount = newAmount;
                            logger.info('buy position: ', tokenAmount);
                            const follow_tx_hash = uuid();
                            follow_txs.set(follow_tx_hash, {
                                following_tx_hash: follow_tx_hash,
                                followed_tx_hash: txHash,
                                followed_account_addr: followed_addr.toBase58(),
                                token_id: tradeTokenId,
                                // token_symbol: '',
                                amount: tokenAmount,
                                trade_direct: true,
                                tms: Math.floor(Date.now() / 1000),
                                block_number: txInfo.blockTime! + 1,
                            });
                        } else {
                            follow_position.amount = buyMaxPositionValueTokenId;
                            logger.info(
                                'buy position: ',
                                buyMaxPositionValueTokenId,
                            );
                            const follow_tx_hash = uuid();
                            follow_txs.set(follow_tx_hash, {
                                following_tx_hash: follow_tx_hash,
                                followed_tx_hash: txHash,
                                followed_account_addr: followed_addr.toBase58(),
                                token_id: tradeTokenId,
                                // token_symbol: '',
                                amount:
                                    buyMaxPositionValueTokenId -
                                    follow_position.amount,
                                trade_direct: true,
                                tms: Math.floor(Date.now() / 1000),
                                block_number: txInfo.blockTime! + 1,
                            });
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
