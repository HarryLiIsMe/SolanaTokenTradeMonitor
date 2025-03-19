import { conf } from '@/conf/conf';
import {
    DEFAULT_COMPUTE_UNIT_LIMIT,
    INTEREST_PROGRAM_ADDRS,
    MICRO_LAMPORTS_PER_LAMPORT,
    SOL_TOKEN_ADDR,
} from '@/constants';
import { logger } from '@/logger';
import {
    Connection,
    LAMPORTS_PER_SOL,
    ParsedTransactionWithMeta,
    PublicKey,
    VersionedTransactionResponse,
} from '@solana/web3.js';
import { getTokenInfo } from './token_utils';

async function getTxRes(
    conn: Connection,
    txHash: string,
): Promise<VersionedTransactionResponse | null> {
    const txRes = await conn.getTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
    });

    return txRes;
}

async function getTxInfo(
    conn: Connection,
    txHash: string,
): Promise<ParsedTransactionWithMeta | null> {
    const txInfo = await conn.getParsedTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
    });

    return txInfo;
}

function getFee(txRes: VersionedTransactionResponse): number {
    if (!txRes.meta || !txRes.meta.fee) {
        return 0;
    }

    return txRes.meta.fee / LAMPORTS_PER_SOL;
}

function getPriorityFee(
    txInfo: ParsedTransactionWithMeta,
    txRes: VersionedTransactionResponse,
): number {
    const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
        'ComputeBudget111111111111111111111111111111',
    );

    // 遍历交易指令，查找 ComputeBudgetProgram.setComputeUnitPrice
    let computeUnitPrice: number | null = null;
    let computeUnitLimit: number | null = null;
    for (let i = 0; i < txInfo!.transaction.message.instructions.length; i++) {
        const instruction = txInfo!.transaction.message.instructions[i];
        if (instruction.programId.equals(COMPUTE_BUDGET_PROGRAM_ID)) {
            const data = Buffer.from(
                txRes!.transaction.message.compiledInstructions[i].data,
            );
            // discriminator == 3
            if (data[0] === 3) {
                computeUnitPrice = data.readUInt32LE(1);
                // logger.info(
                //     `Compute Unit Price Found: ${computeUnitPrice} microLamports`,
                // );
                // discriminator == 2
            } else if (data[0] === 2) {
                computeUnitLimit = data.readUInt32LE(1);
                // logger.info(`Compute Unit Limit Found: ${computeUnitLimit} units`);
            }
        }
    }

    if (computeUnitPrice == null) {
        return 0;
    }
    if (computeUnitLimit == null) {
        computeUnitLimit = DEFAULT_COMPUTE_UNIT_LIMIT;
    }

    return (
        (computeUnitLimit * computeUnitPrice) /
        LAMPORTS_PER_SOL /
        MICRO_LAMPORTS_PER_LAMPORT
    );
}

async function getLastTxHashOfAccount(
    conn: Connection,
    addr: PublicKey,
): Promise<string | null> {
    const signature = await conn.getSignaturesForAddress(addr);

    if (signature.length > 0) {
        return signature[0].signature;
    }

    return null;
}

async function checkTransaction(
    txInfo: ParsedTransactionWithMeta,
    timestamp: number,
    blocknum: number,
): Promise<boolean> {
    // if (!(await checkTimestamp(txInfo.blockTime!))) {
    //     return false;
    // }
    if (timestamp > txInfo.blockTime!) {
        logger.warn('check timestamp failed');
        return false;
    }

    if (blocknum > txInfo.slot!) {
        logger.warn('check block number failed');
        return false;
    }

    if (txInfo.meta!.err) {
        logger.warn('check transaction execute failed');
        return false;
    }

    // check timestamp.
    // const timestamp = Math.floor(new Date().getTime() / 1000);
    // if (txInfo.blockTime! <= timestamp - monitorTimeInterval) {
    //     logger.info(txInfo.blockTime, timestamp);
    //     return false;
    // }

    const instructions = txInfo.transaction.message.instructions;
    const programIds = instructions.map((instruction) =>
        instruction.programId.toBase58(),
    );
    if (!checkInterestProgram(programIds, INTEREST_PROGRAM_ADDRS)) {
        programIds.forEach((programId) => {
            logger.info('instruction:', programId);
        });

        logger.info('check interest program failed');
        return false;
    }

    // let hasInterestProgram = false;
    // interestProgramAddresses.forEach((interestProgramAddress) => {
    //     if (programIds.includes(interestProgramAddress.toBase58())) {
    //         hasInterestProgram = true;
    //     }
    // });

    // // programIds.forEach((programId) => {
    // //     logger.info('instruction:', programId);
    // // });

    // if (!hasInterestProgram) {
    //     programIds.forEach((programId) => {
    //         logger.info('instruction:', programId);
    //     });

    //     return false;
    // }
    // for (let instruction of txInfo.transaction.message.instructions) {
    //     // if (instruction.programId.toBase58() === pumpFunProgramAddress.toBase58()) {
    //     if (
    //         instruction.programId.equals(pumpFunProgramAddress) ||
    //         instruction.programId.equals(raydiumV4AMM)
    //     ) {
    //         return true;
    //     } else {
    //         logger.info('Instruction:', instruction.programId.toBase58());
    //     }
    // }
    return true;
}

// async function checkTimestamp(_timestamp: number): Promise<boolean> {
//     const timestamp = Math.floor(new Date().getTime() / 1000);
//     if (timestamp - _timestamp! > monitorTimeInterval) {
//         logger.info(_timestamp, timestamp);
//         return false;
//     }

//     return true;
// }

function checkInterestProgram(
    programIds: string[],
    interestProgramAddrs: PublicKey[],
): boolean {
    let hasInterestProgram = false;
    interestProgramAddrs.forEach((interestProgramAddrs) => {
        if (programIds.includes(interestProgramAddrs.toBase58())) {
            hasInterestProgram = true;
        }
    });

    // programIds.forEach((programId) => {
    //     logger.info('instruction:', programId);
    // });

    if (!hasInterestProgram) {
        programIds.forEach((programId) => {
            // logger.info('instruction:', programId);
        });

        return false;
    }

    return true;
}

type TxDetails = {
    tokenId: string;
    tokenAmount: number;
    preTokenAmount: number;
    solBalanceChange: number;
    tradeDirect: 'buy' | 'sell';
};

async function getTxDetails(
    monitorAddr: PublicKey,
    txInfo: ParsedTransactionWithMeta,
    txRes: VersionedTransactionResponse,
): Promise<TxDetails | null> {
    const preTokenBalances = txRes.meta!.preTokenBalances!;
    const postTokenBalances = txRes.meta!.postTokenBalances!;
    const preBalances = txRes.meta!.preBalances;
    const postBalances = txRes.meta!.postBalances;
    const preBalance = preBalances[0] / LAMPORTS_PER_SOL;
    const postBalance = postBalances[0] / LAMPORTS_PER_SOL;

    // logger.info(preTokenBalances);
    // logger.info(postTokenBalances);

    let buyer = null;
    let seller = null;
    let buyAmount = 0;
    let sellAmount = 0;
    let preAmount = 0;
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

        if (balanceChange.owner == monitorAddr.toBase58()) {
            if (balanceChange.preBalance > balanceChange.postBalance) {
                sellAmount =
                    balanceChange.preBalance - balanceChange.postBalance;
                preAmount = balanceChange.preBalance;
                sellTokenMint = balanceChange.mint;
                seller = balanceChange.owner;
            } else if (balanceChange.preBalance < balanceChange.postBalance) {
                buyAmount =
                    balanceChange.postBalance - balanceChange.preBalance;
                preAmount = balanceChange.preBalance;
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

    const accountKeys = txRes.transaction.message.staticAccountKeys.map((key) =>
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

    // logger.info('Signer:', signer);
    const fee = txRes.meta!.fee! / LAMPORTS_PER_SOL;
    let priorityFee = await getPriorityFee(txInfo, txRes);
    const swapTokenSolDiff = Math.abs(postBalance - preBalance);

    if (signer == seller) {
        return {
            tokenId: sellTokenMint!,
            tokenAmount: sellAmount,
            preTokenAmount: preAmount,
            solBalanceChange: swapTokenSolDiff,
            tradeDirect: 'sell',
        };
    } else if (signer == buyer) {
        return {
            tokenId: buyTokenMint!,
            tokenAmount: buyAmount,
            preTokenAmount: preAmount,
            solBalanceChange: swapTokenSolDiff,
            tradeDirect: 'buy',
        };
    } else {
        return null;
    }

    // if (signer == seller) {
    //     const tokenInfo = await getTokenInfo(
    //         sellTokenMint!,
    //         conf.solana_rpc_with_metaplex_das_api,
    //     );

    //     let token_decimals = tokenInfo.token_info!.decimals!;
    //     let decimals = 1;
    //     for (let i = 0; i < token_decimals; i++) {
    //         decimals *= 10;
    //     }

    //     logger.info('Sell Operation');
    //     logger.info(
    //         'Token Mint:',
    //         sellTokenMint,
    //         tokenInfo.content.metadata.symbol,
    //     );
    //     logger.info('Sell Amount:', sellAmount);
    //     logger.info(
    //         'Get Sol:',
    //         swapTokenSolDiff,
    //         'Usdt Value:',
    //         swapTokenSolDiff * solUsdtLast,
    //     );
    //     logger.info('Price Sol:', Math.abs(swapTokenSolDiff / sellAmount));
    //     logger.info(
    //         'Price Usdt:',
    //         Math.abs(swapTokenSolDiff / sellAmount) * solUsdtLast,
    //     );

    //     await tokenSwap(
    //         'https://gmgn.ai',
    //         sellTokenMint!,
    //         SOL_TOKEN_ADDR,
    //         process.env.SK!,
    //         Math.ceil(sellAmount * decimals).toString(),
    //         0.5,
    //     );
    // } else if (signer == buyer) {
    //     const tokenInfo = await getTokenInfo(
    //         buyTokenMint!,
    //         conf.solana_rpc_with_metaplex_das_api,
    //     );

    //     logger.info('Buy Operation');
    //     logger.info(
    //         'Token Mint:',
    //         buyTokenMint,
    //         tokenInfo.content.metadata.symbol,
    //     );
    //     logger.info('Buy Amount:', buyAmount);
    //     logger.info(
    //         'Spend Sol:',
    //         swapTokenSolDiff,
    //         'Usdt Value:',
    //         swapTokenSolDiff * solUsdtLast,
    //     );
    //     logger.info('Price Sol:', Math.abs(swapTokenSolDiff / buyAmount));
    //     logger.info(
    //         'Price Usdt:',
    //         Math.abs(swapTokenSolDiff / buyAmount) * solUsdtLast,
    //     );

    //     await tokenSwap(
    //         'https://gmgn.ai',
    //         SOL_TOKEN_ADDR,
    //         buyTokenMint!,
    //         process.env.SK!,
    //         Math.ceil(swapTokenSolDiff * LAMPORTS_PER_SOL).toString(),
    //         0.5,
    //     );
    // } else {
    //     logger.info('Unknow Operator', seller, buyer, signer);
    //     return;
    // }
    // logger.info('Transaction Fee:', fee, 'Usdt Value:', fee * solUsdtLast);
    // logger.info(
    //     'Transaction Priority Fee:',
    //     priorityFee!,
    //     'Usdt Value:',
    //     priorityFee! * solUsdtLast,
    // );
    // logger.info('Timestamp:', trans.blockTime!);

    // if (buyer && seller && tokenMint && amount) {
    // logger.info('Buyer:', buyer);
    // logger.info('Seller:', seller);
    // logger.info('Token Mint:', tokenMint);
    // logger.info('Amount:', amount);
    // // } else {
    //     throw "do't fount buy and sell info";
    // }
}

export {
    getPriorityFee,
    getFee,
    getTxRes,
    getTxInfo,
    getLastTxHashOfAccount,
    checkTransaction,
    getTxDetails,
};
