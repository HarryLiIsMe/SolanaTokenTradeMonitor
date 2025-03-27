import { describe, it } from 'mocha';
import { assert, expect } from 'chai';
import {
    getTxInfo,
    getTxRes,
    getTxDetails,
    getLastTxHashOfAccount,
    getFee,
    getPriorityFee,
    checkTransaction,
} from '../src/utils/tx_utils';
import { init_conf, conf } from '../src/conf/conf';
import { init_logger, logger } from '../src/logger';
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
        this.timeout(3000);

        init_logger();
        init_conf();

        const tx_hash =
            '4fytLBHuqiMxkxRLpXkFMoaG1ebvKFSvUibfuxEseeK4rcoRKaqYeGfehcCADm5TisA91GCgFtiSzj8Tw71TraW7';
        const conn = new Connection(conf.solana_rpc);
        const txInfo = await getTxInfo(conn, tx_hash);
        assert(txInfo !== null, 'test get tx info failed!!!');
        const txRes = await getTxRes(conn, tx_hash);
        assert(txRes !== null, 'test get tx res failed!!!');

        const txDetails = await getTxDetails(
            new PublicKey('3BiW6vEafksxQZp3v2Q4EPAKq3jh4VhCeifdAhqMVUyC'),
            txInfo,
            txRes,
        );
        assert(txDetails !== null, 'test get tx details failed!!!');
        assert(
            txDetails.tradeDirect === 'buy',
            'test get tx details trade direct failed!!!',
        );
    });

    // it('test get fee', async function () {
    //     this.timeout(2000);

    //     init_logger();
    //     init_conf();

    //     const conn = new Connection(conf.solana_rpc);
    //     const txRes = await getTxRes(
    //         conn,
    //         '4fytLBHuqiMxkxRLpXkFMoaG1ebvKFSvUibfuxEseeK4rcoRKaqYeGfehcCADm5TisA91GCgFtiSzj8Tw71TraW7',
    //     );
    //     assert(txRes !== null, 'test get tx res failed!!!');

    //     const fee = getFee(txRes);
    //     assert(fee >= 0, 'test get fee failed!!!');
    // });

    it('test get fee and priority fee', async function () {
        this.timeout(4000);

        init_logger();
        init_conf();

        let tx_hash =
            '4fytLBHuqiMxkxRLpXkFMoaG1ebvKFSvUibfuxEseeK4rcoRKaqYeGfehcCADm5TisA91GCgFtiSzj8Tw71TraW7';
        const conn = new Connection(conf.solana_rpc);
        let txInfo = await getTxInfo(conn, tx_hash);
        assert(txInfo !== null, 'test get tx info failed!!!');
        let txRes = await getTxRes(conn, tx_hash);
        assert(txRes !== null, 'test get tx res failed!!!');

        let fee = getFee(txRes);
        let priorityFee = getPriorityFee(txInfo, txRes);
        assert(Math.abs(fee - 0.003005) < 1e-5, 'test get fee failed!!!');
        assert(
            Math.abs(priorityFee - 0.003) < 1e-5,
            'test get priority fee failed!!!',
        );

        tx_hash =
            '2gGyfgPF6T6QSZ9Cj1M6tzEVhwgDkcr1wnauwSZP65zMousaJg2QfCNH5KyfYu2G65ZYh49hg24xXyy6TMUnr6gZ';
        txInfo = await getTxInfo(conn, tx_hash);
        assert(txInfo !== null, 'test get tx info failed!!!');
        txRes = await getTxRes(conn, tx_hash);
        assert(txRes !== null, 'test get tx res failed!!!');

        fee = getFee(txRes);
        priorityFee = getPriorityFee(txInfo, txRes);
        assert(Math.abs(fee - 0.01) < 1e-5, 'test get fee failed!!!');
        assert(
            Math.abs(priorityFee - 0.01) < 1e-5,
            'test get priority fee failed!!!',
        );

        tx_hash =
            '4btx9adCwjog2kjbnaaKjTa9ggRnEtcHnEQ9jZNwdZn36F8MQ3ECTuKADhLPHyFBo7sfX6ta7QUY7tUXiTdtGo3U';
        txInfo = await getTxInfo(conn, tx_hash);
        assert(txInfo !== null, 'test get tx info failed!!!');
        txRes = await getTxRes(conn, tx_hash);
        assert(txRes !== null, 'test get tx res failed!!!');

        fee = getFee(txRes);
        priorityFee = getPriorityFee(txInfo, txRes);
        logger.info(fee, priorityFee);
        assert(Math.abs(fee - 0.000005) < 1e-5, 'test get fee failed!!!');
        assert(Math.abs(priorityFee) < 1e-5, 'test get priority fee failed!!!');

        tx_hash =
            'JC4E6thu7XwdAWPzph9kW7wUhegDD4ATMe372vwgczurGsCrV8cLoQXihADTz1JmmJKyX4DKKJEqtoXWGCQuGhi';
        txInfo = await getTxInfo(conn, tx_hash);
        assert(txInfo !== null, 'test get tx info failed!!!');
        txRes = await getTxRes(conn, tx_hash);
        assert(txRes !== null, 'test get tx res failed!!!');

        fee = getFee(txRes);
        priorityFee = getPriorityFee(txInfo, txRes);
        logger.info(fee, priorityFee);
        assert(Math.abs(fee - 0.0001238) < 1e-5, 'test get fee failed!!!');
        assert(
            Math.abs(priorityFee - 0.0001188) < 1e-5,
            'test get priority fee failed!!!',
        );
    });

    it('test check transaction', async function () {
        this.timeout(4000);

        init_logger();
        init_conf();

        const conn = new Connection(conf.solana_rpc);
        let txInfo = await getTxInfo(
            conn,
            'L4dU658iJxDTZXLHHssDaYvzK2g6vwjJikU1Ngj5FMBb4M2mctqf7vdizWv44w1Yuifudd1y6AKsMwgVmHAGWPB',
        );
        assert(txInfo !== null, 'test get tx info failed!!!');
        assert(
            await checkTransaction(txInfo, 1, 1),
            'test check transaction!!!',
        );

        // txInfo = await getTxInfo(
        //     conn,
        //     '2gGyfgPF6T6QSZ9Cj1M6tzEVhwgDkcr1wnauwSZP65zMousaJg2QfCNH5KyfYu2G65ZYh49hg24xXyy6TMUnr6gZ',
        // );
        // assert(txInfo !== null, 'test get tx info failed!!!');
        // assert(
        //     await checkTransaction(txInfo, 1, 1),
        //     'test check transaction!!!',
        // );
    });
});
