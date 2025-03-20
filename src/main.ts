import {
    Connection,
    PublicKey,
    Keypair,
    VersionedTransaction,
    LAMPORTS_PER_SOL,
    Signer,
} from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

import { ethers } from 'ethers';

import {
    dasApi,
    DasApiAsset,
} from '@metaplex-foundation/digital-asset-standard-api';
import bs58 from 'bs58';
import fetch from 'node-fetch';
import sleep from 'sleep-promise';
import { okx } from 'ccxt';
// import { token } from '@coral-xyz/anchor/dist/cjs/utils';

const solanaRpcWithMetaplexDasApi =
    'https://mainnet.helius-rpc.com/?api-key=eae2c1db-4332-4ba4-8149-c90bc318acf6';

const solanaRpc =
    'https://ultra-dry-slug.solana-mainnet.quiknode.pro/fc0324e30c127a9e9286eaab40b161d41b7bee32';
const conn = new Connection(solanaRpcWithMetaplexDasApi);

const txHash =
    '47fwy898TCCg9qwBLerG8YQmb9P2ov9E9won4iKZiH6DZm5FgCa4qcVidRB69vcqV9DX9MhzmvGNbM3tVf5JWQYj';
// const txHash =
//     '5qxyjdmhiiyMTnZAWfKqcpUQ4GrCTH52Z7syoTGpz6MmEcNsjyTN8Sfbo7DgMR6N3TDrjVgqQtUVqoy4GizNSpSj';

// second.
const monitorTimeInterval = 10;

const monitorAddress = new PublicKey(
    '3BiW6vEafksxQZp3v2Q4EPAKq3jh4VhCeifdAhqMVUyC',
);

let lastSignature = '';

import { init_logger, logger } from './logger';
import { conf, init_conf } from './conf/conf';
import { init_db } from './model/db_mod';
import { init_web_svr } from './service/web_svr';
import { init_timer_svr } from './service/timer_svr';
import { init_monitor_svr } from './service/monitor_svr';
import { SOL_TOKEN_ADDR } from './constants';
import { tokenSwap } from './utils/swap_utils';
import {
    getTokenInfo,
    getTokenPairPriceFromJupiter,
} from './utils/token_utils';
import { checkTransaction, getPriorityFee, getTxInfo } from './utils/tx_utils';
import { v4 as uuid } from 'uuid';

async function main() {
    try {
        init_logger();
        init_conf();
        await init_db();
        // init_timer_svr();
        init_web_svr();
        init_monitor_svr();

        // setInterval(async () => {
        //     let txHash = await getLastTransactionSignature(monitorAddress);
        //     if (txHash && txHash != lastSignature) {
        //         lastSignature = txHash;
        //         if (await checkTransaction(txHash)) {
        //             logger.info('Tx Hash:', txHash);
        //             const solUsdtLast = await getSol2UsdtLast();
        //             await getTransactionDetails(txHash, solUsdtLast);
        //         }
        //         //  else {
        //         //     throw 'checkTransaction failed';
        //         // }
        //     }
        // }, 1000);
    } catch (e) {
        logger.error('err1:', e);
    }
}

async function getTransactionDetails(txHash: string, solUsdtLast: number) {
    const trans = await conn.getTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
    });

    if (!trans) {
        throw 'Transaction not found';
    }

    const preTokenBalances = trans.meta!.preTokenBalances!;
    const postTokenBalances = trans.meta!.postTokenBalances!;
    const preBalances = trans.meta!.preBalances;
    const postBalances = trans.meta!.postBalances;
    const preBalance = preBalances[0] / LAMPORTS_PER_SOL;
    const postBalance = postBalances[0] / LAMPORTS_PER_SOL;

    // logger.info(preTokenBalances);
    // logger.info(postTokenBalances);

    let buyer = null;
    let seller = null;
    let buyAmount = 0;
    let sellAmount = 0;
    let buyTokenMint = null;
    let sellTokenMint = null;
    let tokenMint = null;
    let signer = null;
    let amount = 0;

    let tokenBalanceChanges: {
        preBalance: number;
        postBalance: number;
        mint: string;
        owner: string;
    }[] = [];
    preTokenBalances.forEach((preBalance) => {
        tokenBalanceChanges[preBalance.accountIndex] = {
            preBalance: preBalance.uiTokenAmount.uiAmount!,
            postBalance: 0,
            mint: preBalance.mint,
            owner: preBalance.owner!,
        };
    });
    postTokenBalances.forEach((postBalance) => {
        if (tokenBalanceChanges[postBalance.accountIndex]) {
            tokenBalanceChanges[postBalance.accountIndex].postBalance =
                postBalance.uiTokenAmount.uiAmount!;
        } else {
            tokenBalanceChanges[postBalance.accountIndex] = {
                preBalance: postBalance.uiTokenAmount.uiAmount!,
                postBalance: 0,
                mint: postBalance.mint,
                owner: postBalance.owner!,
            };
        }
    });
    for (let index in tokenBalanceChanges) {
        const balanceChange = tokenBalanceChanges[index];
        // logger.info(balanceChange.owner);

        if (balanceChange.owner == monitorAddress.toBase58()) {
            if (balanceChange.preBalance > balanceChange.postBalance) {
                sellAmount =
                    balanceChange.preBalance - balanceChange.postBalance;
                sellTokenMint = balanceChange.mint;
                seller = balanceChange.owner;
            } else if (balanceChange.preBalance < balanceChange.postBalance) {
                buyAmount =
                    balanceChange.postBalance - balanceChange.preBalance;
                buyTokenMint = balanceChange.mint;
                buyer = balanceChange.owner;
            }
        }
        // else {
        //     sellAmount = balanceChange.preBalance - balanceChange.postBalance;
        //     sellTokenMint = balanceChange.mint;
        //     seller = balanceChange.owner;

        //     buyAmount = balanceChange.postBalance - balanceChange.preBalance;
        //     buyTokenMint = balanceChange.mint;
        //     buyer = balanceChange.owner;
        // }
    }

    const accountKeys = trans.transaction.message.staticAccountKeys.map((key) =>
        key.toBase58(),
    );

    signer = accountKeys[0];

    // if (postTokenBalances!.length > 0) {
    //     postTokenBalances.forEach((postBalance, index) => {
    //         const preBalance = preTokenBalances![index];
    //         if (
    //             preBalance &&
    //             preBalance.uiTokenAmount.uiAmount! >
    //                 postBalance.uiTokenAmount.uiAmount!
    //         ) {
    //             seller = preBalance.owner!;
    //             amount =
    //                 preBalance.uiTokenAmount.uiAmount! -
    //                 postBalance.uiTokenAmount.uiAmount!;
    //         } else if (
    //             preBalance &&
    //             preBalance.uiTokenAmount.uiAmount! <
    //                 postBalance.uiTokenAmount.uiAmount!
    //         ) {
    //             buyer = postBalance.owner!;
    //             amount =
    //                 postBalance.uiTokenAmount.uiAmount! -
    //                 preBalance.uiTokenAmount.uiAmount!;
    //         }

    //         // if (signer == preBalance.owner) {
    //         //     seller = preBalance.owner!;
    //         //     amount =
    //         //         preBalance.uiTokenAmount.uiAmount! -
    //         //         postBalance.uiTokenAmount.uiAmount!;
    //         // } else if (signer == postBalance.owner) {
    //         //     buyer = postBalance.owner!;
    //         //     amount =
    //         //         postBalance.uiTokenAmount.uiAmount! -
    //         //         preBalance.uiTokenAmount.uiAmount!;
    //         // }
    //         tokenMint = postBalance.mint;
    //     });
    // }

    // if (seller && seller == signer) {
    //     logger.info('Token Mint:', sellTokenMint);
    //     logger.info('Sell Amount:', sellAmount);
    //     logger.info('Get Sol:', postBalance - preBalance);
    //     logger.info('Price:', (postBalance - preBalance) / sellAmount);
    // } else {
    //     logger.info('Token Mint:', buyTokenMint);
    //     logger.info('Buy Amount:', buyAmount);
    //     logger.info('Get Sol:', preBalance - postBalance);
    //     logger.info('Price:', (preBalance - postBalance) / buyAmount);
    // }

    logger.info('Signer:', signer);
    const fee = trans.meta!.fee! / LAMPORTS_PER_SOL;
    let priorityFee = await getPriorityFee(
        conn,
        '5HWeM4DYF5pJERwcSjHTeDgNKxJyW82jh7Aw9vm7Xqxzoc7YfJULmKt4cykKZvwUKFypsqqtPYberyzRKtGrZAW8',
    );
    if (priorityFee == null) {
        priorityFee = 0;
    }
    const swapTokenSolDiff = Math.abs(
        Math.abs(postBalance - preBalance) - fee - priorityFee!,
    );

    if (signer == seller) {
        const tokenInfo = await getTokenInfo(sellTokenMint!);

        let token_decimals = tokenInfo.token_info!.decimals!;
        let decimals = 1;
        for (let i = 0; i < token_decimals; i++) {
            decimals *= 10;
        }

        logger.info('Sell Operation');
        logger.info(
            'Token Mint:',
            sellTokenMint,
            tokenInfo.content.metadata.symbol,
        );
        logger.info('Sell Amount:', sellAmount);
        logger.info(
            'Get Sol:',
            swapTokenSolDiff,
            'Usdt Value:',
            swapTokenSolDiff * solUsdtLast,
        );
        logger.info('Price Sol:', Math.abs(swapTokenSolDiff / sellAmount));
        logger.info(
            'Price Usdt:',
            Math.abs(swapTokenSolDiff / sellAmount) * solUsdtLast,
        );

        await tokenSwap(
            'https://gmgn.ai',
            sellTokenMint!,
            SOL_TOKEN_ADDR,
            process.env.SK!,
            Math.ceil(sellAmount * decimals).toString(),
            0.5,
        );
    } else if (signer == buyer) {
        const tokenInfo = await getTokenInfo(buyTokenMint!);

        logger.info('Buy Operation');
        logger.info(
            'Token Mint:',
            buyTokenMint,
            tokenInfo.content.metadata.symbol,
        );
        logger.info('Buy Amount:', buyAmount);
        logger.info(
            'Spend Sol:',
            swapTokenSolDiff,
            'Usdt Value:',
            swapTokenSolDiff * solUsdtLast,
        );
        logger.info('Price Sol:', Math.abs(swapTokenSolDiff / buyAmount));
        logger.info(
            'Price Usdt:',
            Math.abs(swapTokenSolDiff / buyAmount) * solUsdtLast,
        );

        await tokenSwap(
            'https://gmgn.ai',
            SOL_TOKEN_ADDR,
            buyTokenMint!,
            process.env.SK!,
            Math.ceil(swapTokenSolDiff * LAMPORTS_PER_SOL).toString(),
            0.5,
        );
    } else {
        logger.info('Unknow Operator', seller, buyer, signer);
        return;
    }
    logger.info('Transaction Fee:', fee, 'Usdt Value:', fee * solUsdtLast);
    logger.info(
        'Transaction Priority Fee:',
        priorityFee!,
        'Usdt Value:',
        priorityFee! * solUsdtLast,
    );
    logger.info('Timestamp:', trans.blockTime!);

    // if (buyer && seller && tokenMint && amount) {
    // logger.info('Buyer:', buyer);
    // logger.info('Seller:', seller);
    // logger.info('Token Mint:', tokenMint);
    // logger.info('Amount:', amount);
    // // } else {
    //     throw "do't fount buy and sell info";
    // }
}

// async function getLastTransactionSignature(
//     conn: Connection,
//     addr: PublicKey,
// ): Promise<string | null> {
//     const signature = await conn.getSignaturesForAddress(addr);

//     if (signature.length > 0) {
//         return signature[0].signature;
//     }

//     return null;
// }

// async function getSol2UsdtLast(): Promise<number> {
//     const okx_cex = new okx();
//     const solUsdt = await okx_cex.fetchTicker('SOL/USDT');

//     return solUsdt.last!;
// }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((err2) => {
    logger.error('err2: ', err2);
    process.exitCode = 1;
});

// async function getPriorityFee(
//     connection: Connection,
//     txHash: string,
// ): Promise<number | null> {
//     const tx = await connection.getTransaction(txHash, {
//         commitment: 'confirmed',
//         maxSupportedTransactionVersion: 0,
//     });

//     const txInfo = await connection.getParsedTransaction(txHash, {
//         commitment: 'confirmed',
//         maxSupportedTransactionVersion: 0,
//     });

//     const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
//         'ComputeBudget111111111111111111111111111111',
//     );

//     // 遍历交易指令，查找 ComputeBudgetProgram.setComputeUnitPrice
//     let computeUnitPrice: number | null = null;
//     let computeUnitLimit: number | null = null;
//     for (let i = 0; i < txInfo!.transaction.message.instructions.length; i++) {
//         const instruction = txInfo!.transaction.message.instructions[i];
//         if (instruction.programId.equals(COMPUTE_BUDGET_PROGRAM_ID)) {
//             const data = Buffer.from(
//                 tx!.transaction.message.compiledInstructions[i].data,
//             );
//             // discriminator == 3
//             if (data[0] === 3) {
//                 computeUnitPrice = data.readUInt32LE(1);
//                 // logger.info(
//                 //     `Compute Unit Price Found: ${computeUnitPrice} microLamports`,
//                 // );
//                 // discriminator == 2
//             } else if (data[0] === 2) {
//                 computeUnitLimit = data.readUInt32LE(1);
//                 // logger.info(`Compute Unit Limit Found: ${computeUnitLimit} units`);
//             }
//         }
//     }

//     if (computeUnitPrice == null) {
//         return null;
//     }
//     if (computeUnitLimit == null) {
//         computeUnitLimit = DEFAULT_COMPUTE_UNIT_LIMIT;
//     }

//     return (
//         (computeUnitLimit * computeUnitPrice) /
//         LAMPORTS_PER_SOL /
//         MICRO_LAMPORTS_PER_LAMPORT
//     );
// }

// async function getTransactionFees(connection: Connection, txHash: string) {
//     const tx = await connection.getTransaction(txHash, {
//         maxSupportedTransactionVersion: 0,
//     });
//     if (!tx) {
//         return null;
//     }

//     // 1) Base fee in SOL
//     const baseFeeSol = (tx.meta?.fee || 0) / 1e9;

//     // 2) Actual compute units used
//     const computeUnitsUsed = tx.meta?.computeUnitsConsumed || 0;

//     // 3) Find the “ComputeBudget111111111111111111111111111111” program
//     //    so we only parse instructions *from that program*:
//     const computeBudgetIndex =
//         tx.transaction.message.staticAccountKeys.findIndex(
//             (acc) =>
//                 acc.toBase58() ===
//                 'ComputeBudget111111111111111111111111111111',
//         );
//     if (computeBudgetIndex < 0) {
//         // If the transaction never invokes the ComputeBudget program, no priority fee was set
//         return {
//             baseFee: baseFeeSol,
//             priorityFee: 0,
//             totalFee: baseFeeSol,
//             computeUnitsUsed,
//         };
//     }

//     // 4) Decode the setComputeUnitPrice instruction (opcode 3)
//     let computeUnitPriceMicroLamports: number | null = null;
//     for (const ix of tx.transaction.message.compiledInstructions) {
//         // Skip instructions not from the ComputeBudget program
//         if (ix.programIdIndex !== computeBudgetIndex) {
//             continue;
//         }
//         if (!(ix.data instanceof Uint8Array)) {
//             continue;
//         }
//         // Attempt to decode setComputeUnitPrice
//         const dataArray = Array.from(ix.data);
//         const price = decodeComputeUnitPrice(dataArray);
//         if (price != null) {
//             computeUnitPriceMicroLamports = price;
//             break;
//         }
//     }

//     // 5) If we found a price, multiply by compute units used
//     //    and convert from “micro-lamports” => lamports => SOL
//     let priorityFeeSol = 0;
//     if (computeUnitPriceMicroLamports !== null) {
//         const lamportsPerCU = computeUnitPriceMicroLamports / 1e6;
//         priorityFeeSol = (lamportsPerCU * computeUnitsUsed) / 1e9;
//     }

//     return {
//         baseFee: baseFeeSol,
//         priorityFee: priorityFeeSol,
//         totalFee: baseFeeSol + priorityFeeSol,
//         computeUnitsUsed,
//     };
// }
