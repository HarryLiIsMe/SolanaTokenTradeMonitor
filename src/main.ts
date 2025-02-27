import Debug from 'debug';
import {
    Connection,
    PublicKey,
    Keypair,
    VersionedTransaction,
    LAMPORTS_PER_SOL,
    Signer,
} from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';
import { publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    dasApi,
    DasApiAsset,
} from '@metaplex-foundation/digital-asset-standard-api';
import bs58 from 'bs58';
import fetch from 'node-fetch';
import sleep from 'sleep-promise';
import { okx } from 'ccxt';
import { token } from '@coral-xyz/anchor/dist/cjs/utils';

const logDebug = Debug('debug');
const logInfo = Debug('info');
const logErr = Debug('error');

const MICRO_LAMPORTS_PER_LAMPORT = 1e6;
const DEFAULT_COMPUTE_UNIT_LIMIT = 200000;

const solanaRpcWithMetaplexDasApi =
    'https://mainnet.helius-rpc.com/?api-key=eae2c1db-4332-4ba4-8149-c90bc318acf6';

const solanaRpc =
    'https://ultra-dry-slug.solana-mainnet.quiknode.pro/fc0324e30c127a9e9286eaab40b161d41b7bee32';
const conn = new Connection(solanaRpc);

const txHash =
    '47fwy898TCCg9qwBLerG8YQmb9P2ov9E9won4iKZiH6DZm5FgCa4qcVidRB69vcqV9DX9MhzmvGNbM3tVf5JWQYj';
// const txHash =
//     '5qxyjdmhiiyMTnZAWfKqcpUQ4GrCTH52Z7syoTGpz6MmEcNsjyTN8Sfbo7DgMR6N3TDrjVgqQtUVqoy4GizNSpSj';

const pumpFun = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
const moonshot = new PublicKey('MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG');

const raydiumLiquidityPoolV4 = new PublicKey(
    '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
);
const raydiumConcentratedLiquidity = new PublicKey(
    'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
);
const raydiumCPMM = new PublicKey(
    'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
);
const raydiumStable = new PublicKey(
    '5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h',
);

const openBooksV2 = new PublicKey(
    'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb',
);

const meteoraDLMM = new PublicKey(
    'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
);
const meteoraPoolsSwap = new PublicKey(
    'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
);
const lifinityV1Pool = new PublicKey(
    'EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gjeoi8dy3S',
);
const lifinitySwapV2 = new PublicKey(
    '2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c',
);
const fluxBeam = new PublicKey('FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X');
const phoenixSwap = new PublicKey(
    'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
);
const whirlpoolsSwapV2 = new PublicKey(
    'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
);
const solFiSwap = new PublicKey('SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe');
const zeroFi = new PublicKey('ZERor4xhbUycZ6gb9ntrhqscUcZmAbQDjEAtCf4hbZY');
const aldrinV1 = new PublicKey('AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6');
const aldrinV2 = new PublicKey('CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4');
const obricV2 = new PublicKey('obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y');
const sanctum = new PublicKey('5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx');

const jupiterAggregatorV6 = new PublicKey(
    'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
);
const oKXDEXAggregationRouterV2 = new PublicKey(
    '6m2CDdhRgxpH4WjvdzxAYbGxwdGUz5MziiL5jek2kBma',
);

// second.
const monitorTimeInterval = 10;

const interestProgramAddresses: PublicKey[] = [
    pumpFun,
    moonshot,
    raydiumLiquidityPoolV4,
    raydiumConcentratedLiquidity,
    raydiumCPMM,
    raydiumStable,
    jupiterAggregatorV6,
    oKXDEXAggregationRouterV2,
    meteoraDLMM,
    meteoraPoolsSwap,
    lifinityV1Pool,
    lifinitySwapV2,
    phoenixSwap,
    whirlpoolsSwapV2,
    solFiSwap,
    zeroFi,
    openBooksV2,
    aldrinV1,
    aldrinV2,
    obricV2,
    sanctum,
    fluxBeam,
];

const monitorAddress = new PublicKey(
    '3BiW6vEafksxQZp3v2Q4EPAKq3jh4VhCeifdAhqMVUyC',
);

let lastSignature = '';

async function main() {
    try {
        // await tokenSwap(
        //     'https://gmgn.ai',
        //     'So11111111111111111111111111111111111111112',
        //     '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
        //     process.env.SK!,
        //     '100',
        //     0.5,
        // );

        // await getTokenInfo('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN');

        setInterval(async () => {
            let txHash = await getLastTransactionSignature(monitorAddress);
            if (txHash && txHash != lastSignature) {
                lastSignature = txHash;
                if (await checkTransaction(txHash)) {
                    logInfo('Tx Hash:', txHash);
                    const solUsdtLast = await getSol2UsdtLast();

                    await getTransactionDetails(txHash, solUsdtLast);
                }
                //  else {
                //     throw 'checkTransaction failed';
                // }
            }
        }, 1000);
    } catch (e) {
        logErr('err1:', e);
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

    // logInfo(preTokenBalances);
    // logInfo(postTokenBalances);

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
        // logInfo(balanceChange.owner);

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
    //     logInfo('Token Mint:', sellTokenMint);
    //     logInfo('Sell Amount:', sellAmount);
    //     logInfo('Get Sol:', postBalance - preBalance);
    //     logInfo('Price:', (postBalance - preBalance) / sellAmount);
    // } else {
    //     logInfo('Token Mint:', buyTokenMint);
    //     logInfo('Buy Amount:', buyAmount);
    //     logInfo('Get Sol:', preBalance - postBalance);
    //     logInfo('Price:', (preBalance - postBalance) / buyAmount);
    // }

    logInfo('Signer:', signer);
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
        const tokenInfo = (await getTokenInfo(
            sellTokenMint!,
        )) as unknown as DasApiAsset & {
            token_info?: { decimals?: number };
        };

        let token_decimals = tokenInfo.token_info!.decimals!;
        let decimals = 1;
        for (let i = 0; i < token_decimals; i++) {
            decimals *= 10;
        }

        logInfo('Sell Operation');
        logInfo(
            'Token Mint:',
            sellTokenMint,
            tokenInfo.content.metadata.symbol,
        );
        logInfo('Sell Amount:', sellAmount);
        logInfo(
            'Get Sol:',
            swapTokenSolDiff,
            'Usdt Value:',
            swapTokenSolDiff * solUsdtLast,
        );
        logInfo('Price Sol:', Math.abs(swapTokenSolDiff / sellAmount));
        logInfo(
            'Price Usdt:',
            Math.abs(swapTokenSolDiff / sellAmount) * solUsdtLast,
        );

        await tokenSwap(
            'https://gmgn.ai',
            sellTokenMint!,
            'So11111111111111111111111111111111111111112',
            process.env.SK!,
            Math.ceil(sellAmount * decimals).toString(),
            0.5,
        );
    } else if (signer == buyer) {
        const tokenInfo = await getTokenInfo(buyTokenMint!);

        logInfo('Buy Operation');
        logInfo('Token Mint:', buyTokenMint, tokenInfo.content.metadata.symbol);
        logInfo('Buy Amount:', buyAmount);
        logInfo(
            'Spend Sol:',
            swapTokenSolDiff,
            'Usdt Value:',
            swapTokenSolDiff * solUsdtLast,
        );
        logInfo('Price Sol:', Math.abs(swapTokenSolDiff / buyAmount));
        logInfo(
            'Price Usdt:',
            Math.abs(swapTokenSolDiff / buyAmount) * solUsdtLast,
        );

        await tokenSwap(
            'https://gmgn.ai',
            'So11111111111111111111111111111111111111112',
            buyTokenMint!,
            process.env.SK!,
            Math.ceil(swapTokenSolDiff * LAMPORTS_PER_SOL).toString(),
            0.5,
        );
    } else {
        logInfo('Unknow Operator', seller, buyer, signer);
        return;
    }
    logInfo('Transaction Fee:', fee, 'Usdt Value:', fee * solUsdtLast);
    logInfo(
        'Transaction Priority Fee:',
        priorityFee!,
        'Usdt Value:',
        priorityFee! * solUsdtLast,
    );
    logInfo('Timestamp:', trans.blockTime!);

    // if (buyer && seller && tokenMint && amount) {
    // logInfo('Buyer:', buyer);
    // logInfo('Seller:', seller);
    // logInfo('Token Mint:', tokenMint);
    // logInfo('Amount:', amount);
    // // } else {
    //     throw "do't fount buy and sell info";
    // }
}

async function checkTransaction(txHash: string): Promise<boolean> {
    const txInfo = await conn.getParsedTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
    });

    if (!txInfo) {
        throw 'Transaction not found';
    }

    if (!(await checkTimestamp(txInfo.blockTime!))) {
        return false;
    }

    if (txInfo.meta!.err) {
        logInfo('Transaction Execute Failed');
        return false;
    }

    // check timestamp.
    // const timestamp = Math.floor(new Date().getTime() / 1000);
    // if (txInfo.blockTime! <= timestamp - monitorTimeInterval) {
    //     logInfo(txInfo.blockTime, timestamp);
    //     return false;
    // }

    const instructions = txInfo.transaction.message.instructions;
    const programIds = instructions.map((instruction) =>
        instruction.programId.toBase58(),
    );
    if (!(await checkInterestProgram(programIds))) {
        programIds.forEach((programId) => {
            logInfo('instruction:', programId);
        });

        return false;
    }

    // let hasInterestProgram = false;
    // interestProgramAddresses.forEach((interestProgramAddress) => {
    //     if (programIds.includes(interestProgramAddress.toBase58())) {
    //         hasInterestProgram = true;
    //     }
    // });

    // // programIds.forEach((programId) => {
    // //     logInfo('instruction:', programId);
    // // });

    // if (!hasInterestProgram) {
    //     programIds.forEach((programId) => {
    //         logInfo('instruction:', programId);
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
    //         logInfo('Instruction:', instruction.programId.toBase58());
    //     }
    // }
    return true;
}

async function checkTimestamp(_timestamp: number): Promise<boolean> {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    if (timestamp - _timestamp! > monitorTimeInterval) {
        logInfo(_timestamp, timestamp);
        return false;
    }

    return true;
}

async function checkInterestProgram(programIds: string[]): Promise<boolean> {
    let hasInterestProgram = false;
    interestProgramAddresses.forEach((interestProgramAddress) => {
        if (programIds.includes(interestProgramAddress.toBase58())) {
            hasInterestProgram = true;
        }
    });

    // programIds.forEach((programId) => {
    //     logInfo('instruction:', programId);
    // });

    if (!hasInterestProgram) {
        programIds.forEach((programId) => {
            logInfo('instruction:', programId);
        });

        return false;
    }

    return true;
}

async function getLastTransactionSignature(
    addr: PublicKey,
): Promise<string | null> {
    const signature = await conn.getSignaturesForAddress(addr);

    if (signature.length > 0) {
        return signature[0].signature;
    }

    return null;
}

async function getTokenInfo(programId: string): Promise<DasApiAsset> {
    const umi = createUmi(solanaRpcWithMetaplexDasApi).use(dasApi());
    const assetId = publicKey(programId);

    const assetInfo = await umi.rpc.getAsset(assetId);
    return assetInfo;
}

// swap get quote.
type TypeSwapGetQuote = {
    code: number;
    msg: string;
    tid: string;
    data: {
        quote: {
            inputMint: string;
            inAmount: string;
            outputMint: string;
            outAmount: string;
            otherAmountThreshold: string;
            inDecimals: 9;
            outDecimals: 6;
            swapMode: string;
            slippageBps: string;
            platformFee: string;
            priceImpactPct: string;
            routePlan: {
                swapInfo: {
                    ammKey: string;
                    label: string;
                    inputMint: string;
                    outputMint: string;
                    inAmount: string;
                    outAmount: string;
                    feeAmount: string;
                    feeMint: string;
                };
                percent: number;
            }[];
            timeTaken: number;
        };
        raw_tx: {
            swapTransaction: string;
            lastValidBlockHeight: number;
            prioritizationFeeLamports: number;
            recentBlockhash: string;
            version: string;
        };
        amount_in_usd: string;
        amount_out_usd: string;
        jito_order_id: null | string;
    };
};
async function swapGetQuote(
    url: string,
    inputToken: string,
    outputToken: string,
    sk: string,
    inAmount: string,
    slippage: number,
): Promise<TypeSwapGetQuote> {
    // const slippage = 0.5;
    // GMGN API 域名
    // const API_HOST = 'https://gmgn.ai';

    // 钱包初始化，如果用Phantom则忽略该步骤
    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(sk)));
    const fromAddress = wallet.payer.publicKey.toString();
    logInfo('fromAddress: ', fromAddress);
    // logInfo(`wallet address: ${wallet.publicKey.toString()}`);
    // swap quote.
    // const quoteUrl = `${url}?token_in_address=${inputToken}&token_out_address=${outputToken}&in_amount=${inAmount}&from_address=${fromAddress}&slippage=${slippage}`;
    // logInfo(quoteUrl);
    let route = (await (
        await fetch(url)
    ).json()) as unknown as TypeSwapGetQuote;
    // route = await route.json();

    return route;
}

// swap send transaction.
type TypeSwapSendTransaction = {
    code: number;
    msg: string;
    data: {
        tx_hash: string;
        time_taken: number;
    };
};
async function swapSendTransaction(
    url: string,
    rawTransaction: string,
    payer: Signer,
): Promise<TypeSwapSendTransaction> {
    const swapTransactionBuf = Buffer.from(rawTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    transaction.sign([payer]);
    const signedTx = Buffer.from(transaction.serialize()).toString('base64');
    // logInfo(signedTx);
    // 提交交易
    // const swapSendTransactionUrl = `${apiHost}/defi/router/v1/sol/tx/submit_signed_transaction`;
    // logInfo('swapSendTransactionUrl: ', swapSendTransactionUrl);
    let res = (await (
        await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                signed_tx: signedTx,
                from_address: payer.publicKey.toString(),
            }),
        })
    ).json()) as unknown as TypeSwapSendTransaction;
    // res = await res.json();

    return res;
}

// swap get transaction status.
type TypeSwapGetTransactionStatus = {
    code: number;
    msg: string;
    data: {
        success: boolean;
        failed: boolean;
        expired: boolean;
        err: null | string;
        err_code: string;
    };
};
async function swapGetTransactionStatus(
    url: string,
): Promise<TypeSwapGetTransactionStatus> {
    while (true) {
        let status = (await (
            await fetch(url)
        ).json()) as unknown as TypeSwapGetTransactionStatus;
        // status = await status.json();
        if (
            status &&
            (status.data.success === true || status.data.expired === true)
        ) {
            return status;
        }
        await sleep(200);
    }
}

async function tokenSwap(
    apiHost: string,
    inputToken: string,
    outputToken: string,
    sk: string,
    inAmount: string,
    slippage: number,
) {
    // const fromAddress = '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN';
    // GMGN API 域名

    // 钱包初始化，如果用Phantom则忽略该步骤
    // const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(sk)));
    // const fromAddress = wallet.payer.publicKey.toString();
    // logInfo('fromAddress: ', fromAddress);
    // logInfo(`wallet address: ${wallet.publicKey.toString()}`);
    // swap quote.
    // const quoteUrl = `${apiHost}/defi/router/v1/sol/tx/get_swap_route?token_in_address=${inputToken}&token_out_address=${outputToken}&in_amount=${inAmount}&from_address=${fromAddress}&slippage=${slippage}`;
    // let route = await fetch(quoteUrl);
    // route = await route.json();
    // logInfo(route);

    // swap get quote.
    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(sk)));
    const fromAddress = wallet.payer.publicKey.toString();
    const quoteUrl = `${apiHost}/defi/router/v1/sol/tx/get_swap_route?token_in_address=${inputToken}&token_out_address=${outputToken}&in_amount=${inAmount}&from_address=${fromAddress}&slippage=${slippage}`;
    const swapGetQuoteRes = await swapGetQuote(
        quoteUrl,
        inputToken,
        outputToken,
        sk,
        inAmount,
        slippage,
    );
    // logInfo(swapGetQuoteRes);

    // const swapTransactionBuf = Buffer.from(
    //     route.data.raw_tx.swapTransaction,
    //     'base64',
    // );
    // const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    // transaction.sign([wallet.payer]);
    // const signedTx = Buffer.from(transaction.serialize()).toString('base64');
    // console.log(signedTx);
    // // 提交交易
    // logInfo('swapSendTransactionUrl: ', swapSendTransactionUrl);
    // let res = await fetch(swapSendTransactionUrl, {
    //     method: 'POST',
    //     headers: { 'content-type': 'application/json' },
    //     body: JSON.stringify({
    //         signed_tx: signedTx,
    //     }),
    // });
    // res = await res.json();

    // swap send transaction.
    const rawTransaction = swapGetQuoteRes.data.raw_tx.swapTransaction;
    const payer = wallet.payer;
    const swapSendTransactionUrl = `${apiHost}/defi/router/v1/sol/tx/submit_signed_bundle_transaction`;
    const swapSendTransactionRes = await swapSendTransaction(
        swapSendTransactionUrl,
        rawTransaction,
        payer,
    );
    // logInfo(swapSendTransactionRes);

    // // swap get transaction status
    // 如果上链成功，则success返回true
    // 如果没上链，60秒就会返回expired=true
    // while (true) {
    //     const hash = swapTx.data.hash;
    //     const lastValidBlockHeight = route.data.raw_tx.lastValidBlockHeight;
    //     const statusUrl = `${apiHost}/defi/router/v1/sol/tx/get_transaction_status?hash=${hash}&last_valid_height=${lastValidBlockHeight}`;
    //     let status = await fetch(statusUrl);
    //     status = await status.json();
    //     logInfo(status);
    //     if (
    //         status &&
    //         (status.data.success === true || status.data.expired === true)
    //     )
    //         break;
    //     await sleep(1000);
    // }

    // swap get transaction status.
    const hash = swapSendTransactionRes.data.tx_hash;
    const lastValidBlockHeight =
        swapGetQuoteRes.data.raw_tx.lastValidBlockHeight;
    const swapGetTransactionUrl = `${apiHost}/defi/router/v1/sol/tx/get_transaction_status?hash=${hash}&last_valid_height=${lastValidBlockHeight}`;
    const swapGetTransactionStatusRes = await swapGetTransactionStatus(
        swapGetTransactionUrl,
    );
    logInfo(swapGetTransactionStatusRes);
    logInfo('tx hash:', swapSendTransactionRes.data.tx_hash);
}

async function getSol2UsdtLast(): Promise<number> {
    const okx_cex = new okx();
    const solUsdt = await okx_cex.fetchTicker('SOL/USDT');

    return solUsdt.last!;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((err2) => {
    logErr('err2: ', err2);
    process.exitCode = 1;
});

async function getPriorityFee(
    connection: Connection,
    txHash: string,
): Promise<number | null> {
    const tx = await connection.getTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
    });

    const txInfo = await connection.getParsedTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
    });

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
                tx!.transaction.message.compiledInstructions[i].data,
            );
            // discriminator == 3
            if (data[0] === 3) {
                computeUnitPrice = data.readUInt32LE(1);
                // logInfo(
                //     `Compute Unit Price Found: ${computeUnitPrice} microLamports`,
                // );
                // discriminator == 2
            } else if (data[0] === 2) {
                computeUnitLimit = data.readUInt32LE(1);
                // logInfo(`Compute Unit Limit Found: ${computeUnitLimit} units`);
            }
        }
    }

    if (computeUnitPrice == null) {
        return null;
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
