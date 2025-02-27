import Debug from 'debug';
import { Connection, PublicKey } from '@solana/web3.js';
import { web3 } from '@coral-xyz/anchor';
import { publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    dasApi,
    DasApiAsset,
} from '@metaplex-foundation/digital-asset-standard-api';

const logDebug = Debug('debug');
const logInfo = Debug('info');
const logErr = Debug('error');

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
        // await getTokenInfo('6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN');

        setInterval(async () => {
            let txHash = await getLastTransactionSignature(monitorAddress);
            if (txHash && txHash != lastSignature) {
                lastSignature = txHash;
                if (await checkTransaction(txHash)) {
                    await getTransactionDetails(txHash);
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

async function getTransactionDetails(txHash: string) {
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
    const preBalance = preBalances[0] / web3.LAMPORTS_PER_SOL;
    const postBalance = postBalances[0] / web3.LAMPORTS_PER_SOL;

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

    logInfo('Signer::', signer);
    if (signer == seller) {
        logInfo('Sell Operation');
        logInfo(
            'Token Mint:',
            sellTokenMint,
            (await getTokenInfo(sellTokenMint!)).content.metadata.symbol,
        );
        logInfo('Sell Amount:', sellAmount);
        logInfo('Get Sol:', postBalance - preBalance);
        logInfo('Price:', Math.abs((postBalance - preBalance) / sellAmount));
        logInfo('Timestamp:', trans.blockTime!);
    } else if (signer == buyer) {
        logInfo('Buy Operation');
        logInfo(
            'Token Mint:',
            buyTokenMint,
            (await getTokenInfo(buyTokenMint!)).content.metadata.symbol,
        );
        logInfo('Buy Amount:', buyAmount);
        logInfo('Get Sol:', preBalance - postBalance);
        logInfo('Price:', Math.abs((preBalance - postBalance) / buyAmount));
        logInfo('Timestamp:', trans.blockTime!);
    } else {
        logInfo('Unknow Operator', seller, buyer, signer);
    }

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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((err2) => {
    logErr('err2: ', err2);
    process.exitCode = 1;
});
