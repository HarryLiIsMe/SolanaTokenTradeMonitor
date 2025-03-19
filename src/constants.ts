import { PublicKey } from '@solana/web3.js';

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

const INTEREST_PROGRAM_ADDRS: PublicKey[] = [
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

const MICRO_LAMPORTS_PER_LAMPORT = 1e6;
const DEFAULT_COMPUTE_UNIT_LIMIT = 200000;

const SOL_TOKEN_ADDR = 'So11111111111111111111111111111111111111112';
const USDT_TOKEN_ADDR = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

export {
    MICRO_LAMPORTS_PER_LAMPORT,
    DEFAULT_COMPUTE_UNIT_LIMIT,
    INTEREST_PROGRAM_ADDRS,
    SOL_TOKEN_ADDR,
    USDT_TOKEN_ADDR,
};
