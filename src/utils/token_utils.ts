import { publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    dasApi,
    DasApiAsset,
} from '@metaplex-foundation/digital-asset-standard-api';
import { okx } from 'ccxt';
import { conf } from '@/conf/conf';
import z from 'zod';
import { getMint, Mint } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

async function getTokenInfo1(tokenProgramId: string): Promise<
    DasApiAsset & {
        token_info?: { decimals?: number };
    }
> {
    const umi = createUmi(conf.solana_rpc_with_metaplex_das_api).use(dasApi());
    const assetId = publicKey(tokenProgramId);

    const assetInfo = await umi.rpc.getAsset(assetId);
    return assetInfo;
}

async function getTokenInfo2(
    conn: Connection,
    tokenProgramId: string,
): Promise<Mint> {
    const mintPublicKey = new PublicKey(tokenProgramId);
    const mintInfo = await getMint(conn, mintPublicKey);
    return mintInfo;
}

async function getTokenPriceFromPyth(
    inTokenName: string,
    outTokenName: string,
): Promise<number | undefined> {
    return 0;
}

async function getTokenPriceFromOkxCex(
    inTokenName: string,
    outTokenName: string,
): Promise<number | undefined> {
    const okx_cex = new okx();
    const solUsdt = await okx_cex.fetchTicker(`${inTokenName}/${outTokenName}`);

    return solUsdt.last;
}

// rate limit.
async function getTokenPriceFromJupiter(
    price_api: string,
    token_in: string[],
    token_out: string[],
): Promise<number> {
    const reqUrl = `${price_api}/price/v2?ids=${token_in[0]}&vsToken=${token_out[0]}`;
    const priceResponseWithVsToken = await fetch(reqUrl);

    const price_json = JSON.stringify(
        await priceResponseWithVsToken.json(),
        null,
        2,
    );

    const price: TypePriceJupiter = PriceJupiter.parse(JSON.parse(price_json));

    return parseFloat(price.data[token_in[0]].price);
}

// async function getSol2UsdtLastFromJupiter(): Promise<number> {
//     return await getTokenPairPriceFromJupiter(
//         conf.price_api,
//         WSOL_TOKEN_ADDR,
//         USDT_TOKEN_ADDR,
//     );
// }

// async function getUsdt2SolLastFromJupiter(): Promise<number> {
//     return await getTokenPairPriceFromJupiter(
//         conf.price_api,
//         USDT_TOKEN_ADDR,
//         WSOL_TOKEN_ADDR,
//     );
// }

const PriceData = z.object({
    id: z.string(),
    type: z.string(),
    price: z.string(),
});
const Data = z.record(z.string(), PriceData);
const PriceJupiter = z.object({
    data: Data,
    timeTaken: z.number(),
});
type TypePriceJupiter = z.infer<typeof PriceJupiter>;

export {
    getTokenInfo1,
    getTokenInfo2,
    getTokenPriceFromOkxCex,
    getTokenPriceFromJupiter,
    getTokenPriceFromPyth,
};
