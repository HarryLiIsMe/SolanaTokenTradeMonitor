import { logger } from '@/logger';
import { Wallet } from '@coral-xyz/anchor';
import { Keypair, Signer, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import sleep from 'sleep-promise';

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
    logger.info('fromAddress: ', fromAddress);
    // logger.info(`wallet address: ${wallet.publicKey.toString()}`);
    // swap quote.
    // const quoteUrl = `${url}?token_in_address=${inputToken}&token_out_address=${outputToken}&in_amount=${inAmount}&from_address=${fromAddress}&slippage=${slippage}`;
    // logger.info(quoteUrl);
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
    // logger.info(signedTx);
    // 提交交易
    // const swapSendTransactionUrl = `${apiHost}/defi/router/v1/sol/tx/submit_signed_transaction`;
    // logger.info('swapSendTransactionUrl: ', swapSendTransactionUrl);
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
    swapApi: string,
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
    // logger.info('fromAddress: ', fromAddress);
    // logger.info(`wallet address: ${wallet.publicKey.toString()}`);
    // swap quote.
    // const quoteUrl = `${apiHost}/defi/router/v1/sol/tx/get_swap_route?token_in_address=${inputToken}&token_out_address=${outputToken}&in_amount=${inAmount}&from_address=${fromAddress}&slippage=${slippage}`;
    // let route = await fetch(quoteUrl);
    // route = await route.json();
    // logger.info(route);

    // swap get quote.
    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(sk)));
    const fromAddress = wallet.payer.publicKey.toString();
    const quoteUrl = `${swapApi}/defi/router/v1/sol/tx/get_swap_route?token_in_address=${inputToken}&token_out_address=${outputToken}&in_amount=${inAmount}&from_address=${fromAddress}&slippage=${slippage}`;
    const swapGetQuoteRes = await swapGetQuote(
        quoteUrl,
        inputToken,
        outputToken,
        sk,
        inAmount,
        slippage,
    );
    // logger.info(swapGetQuoteRes);

    // const swapTransactionBuf = Buffer.from(
    //     route.data.raw_tx.swapTransaction,
    //     'base64',
    // );
    // const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    // transaction.sign([wallet.payer]);
    // const signedTx = Buffer.from(transaction.serialize()).toString('base64');
    // console.log(signedTx);
    // // 提交交易
    // logger.info('swapSendTransactionUrl: ', swapSendTransactionUrl);
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
    const swapSendTransactionUrl = `${swapApi}/defi/router/v1/sol/tx/submit_signed_bundle_transaction`;
    const swapSendTransactionRes = await swapSendTransaction(
        swapSendTransactionUrl,
        rawTransaction,
        payer,
    );
    // logger.info(swapSendTransactionRes);

    // // swap get transaction status
    // 如果上链成功，则success返回true
    // 如果没上链，60秒就会返回expired=true
    // while (true) {
    //     const hash = swapTx.data.hash;
    //     const lastValidBlockHeight = route.data.raw_tx.lastValidBlockHeight;
    //     const statusUrl = `${apiHost}/defi/router/v1/sol/tx/get_transaction_status?hash=${hash}&last_valid_height=${lastValidBlockHeight}`;
    //     let status = await fetch(statusUrl);
    //     status = await status.json();
    //     logger.info(status);
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
    const swapGetTransactionUrl = `${swapApi}/defi/router/v1/sol/tx/get_transaction_status?hash=${hash}&last_valid_height=${lastValidBlockHeight}`;
    const swapGetTransactionStatusRes = await swapGetTransactionStatus(
        swapGetTransactionUrl,
    );
    logger.info(swapGetTransactionStatusRes);
    logger.info('tx hash:', swapSendTransactionRes.data.tx_hash);
}

export { tokenSwap };
