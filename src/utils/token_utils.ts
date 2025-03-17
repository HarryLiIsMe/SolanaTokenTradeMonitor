import { publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    dasApi,
    DasApiAsset,
} from '@metaplex-foundation/digital-asset-standard-api';
import { okx } from 'ccxt';

async function getTokenInfo(
    programId: string,
    solanaRpcWithMetaplexDasApi: string,
): Promise<
    DasApiAsset & {
        token_info?: { decimals?: number };
    }
> {
    const umi = createUmi(solanaRpcWithMetaplexDasApi).use(dasApi());
    const assetId = publicKey(programId);

    const assetInfo = await umi.rpc.getAsset(assetId);
    return assetInfo;
}

async function getSol2UsdtLast(): Promise<number> {
    const okx_cex = new okx();
    const solUsdt = await okx_cex.fetchTicker('SOL/USDT');

    return solUsdt.last!;
}

export { getTokenInfo, getSol2UsdtLast };
