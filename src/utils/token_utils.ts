import { publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    dasApi,
    DasApiAsset,
} from '@metaplex-foundation/digital-asset-standard-api';
import { okx } from 'ccxt';
import { conf } from '@/conf/conf';
import z from 'zod';
import { token } from '@coral-xyz/anchor/dist/cjs/utils';
import { SOL_TOKEN_ADDR, USDT_TOKEN_ADDR } from '@/constants';

async function getTokenInfo(programId: string): Promise<
    DasApiAsset & {
        token_info?: { decimals?: number };
    }
> {
    const umi = createUmi(conf.solana_rpc_with_metaplex_das_api).use(dasApi());
    const assetId = publicKey(programId);

    const assetInfo = await umi.rpc.getAsset(assetId);
    return assetInfo;
}

async function getSol2UsdtLastFromCex(): Promise<number | undefined> {
    const okx_cex = new okx();
    const solUsdt = await okx_cex.fetchTicker('SOL/USDT');

    return solUsdt.last;
}

async function getSol2UsdtLastFromJupiter(): Promise<number> {
    return await getTokenPairPriceFromJupiter(
        conf.price_api,
        SOL_TOKEN_ADDR,
        USDT_TOKEN_ADDR,
    );
}

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

async function getTokenPairPriceFromJupiter(
    price_api: string,
    token_in: string,
    token_out: string,
): Promise<number> {
    const priceResponseWithVsToken = await fetch(
        `${price_api}/price/v2?ids=${token_in}&vsToken=${token_out}`,
    );

    const price_json = JSON.stringify(
        await priceResponseWithVsToken.json(),
        null,
        2,
    );

    const price: TypePriceJupiter = PriceJupiter.parse(JSON.parse(price_json));

    return parseFloat(price.data[token_in].price);
}

export {
    getTokenInfo,
    getSol2UsdtLastFromCex,
    getSol2UsdtLastFromJupiter,
    getTokenPairPriceFromJupiter,
};
