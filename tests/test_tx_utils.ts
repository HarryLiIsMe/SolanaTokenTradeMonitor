import { describe, it } from 'mocha';
import { assert, expect } from 'chai';
import {
    getTxInfo,
    getTxRes,
    getTxDetails,
    getLastTxHashOfAccount,
} from '../src/utils/tx_utils';
import { init_conf, conf } from '../src/conf/conf';
import { init_logger } from '../src/logger';
import { Connection, PublicKey } from '@solana/web3.js';

describe('test tx utils', function () {
    it('test get tx res', async function () {
        this.timeout(2000);

        init_logger();
        init_conf();

        const conn = new Connection(conf.solana_rpc);
        const txRes = await getTxRes(
            conn,
            '4fytLBHuqiMxkxRLpXkFMoaG1ebvKFSvUibfuxEseeK4rcoRKaqYeGfehcCADm5TisA91GCgFtiSzj8Tw71TraW7',
        );
        assert(txRes !== null, 'test get tx res failed!!!');
    });

    it('test get tx info', async function () {
        this.timeout(2000);

        init_logger();
        init_conf();

        const conn = new Connection(conf.solana_rpc);
        const txInfo = await getTxInfo(
            conn,
            '4fytLBHuqiMxkxRLpXkFMoaG1ebvKFSvUibfuxEseeK4rcoRKaqYeGfehcCADm5TisA91GCgFtiSzj8Tw71TraW7',
        );
        assert(txInfo !== null, 'test get tx info failed!!!');
    });

    it('test last tx hash of account', async function () {
        this.timeout(2000);

        init_logger();
        init_conf();

        const conn = new Connection(conf.solana_rpc);
        const txHash = await getLastTxHashOfAccount(
            conn,
            new PublicKey('3BiW6vEafksxQZp3v2Q4EPAKq3jh4VhCeifdAhqMVUyC'),
        );
        assert(txHash !== null, 'test get tx info failed!!!');
    });

    it('test get tx details', async function () {
        this.timeout(2000);

        init_logger();
        init_conf();

        const conn = new Connection(conf.solana_rpc);
        const txInfo = await getTxInfo(
            conn,
            '4fytLBHuqiMxkxRLpXkFMoaG1ebvKFSvUibfuxEseeK4rcoRKaqYeGfehcCADm5TisA91GCgFtiSzj8Tw71TraW7',
        );
        assert(txInfo !== null, 'test get tx info failed!!!');
        const txRes = await getTxRes(
            conn,
            '4fytLBHuqiMxkxRLpXkFMoaG1ebvKFSvUibfuxEseeK4rcoRKaqYeGfehcCADm5TisA91GCgFtiSzj8Tw71TraW7',
        );
        assert(txRes !== null, 'test get tx res failed!!!');

        const txDetails = await getTxDetails(
            new PublicKey('3BiW6vEafksxQZp3v2Q4EPAKq3jh4VhCeifdAhqMVUyC'),
            txInfo,
            txRes,
        );
        assert(txDetails !== null, 'test get tx details failed!!!');
    });
});
