import { PublicKey } from '@solana/web3.js';
import { logger } from '../logger';
import express, { Request, Response } from 'express';
import bs58 from 'bs58';
import { follow_positions, follow_txs, followed_usrs } from '@/model/db_mod';

export { folllow_mgr_router };

const folllow_mgr_router = express.Router();

folllow_mgr_router.get('/add_followed_addr/:addr', add_followed_addr);
folllow_mgr_router.get('/del_followed_addr/:addr', del_followed_addr);
folllow_mgr_router.get('/list_followed_users', list_followed_users);
folllow_mgr_router.get('/list_follow_positions', list_follow_positions);
folllow_mgr_router.get('/list_follow_txs', list_follow_txs);

function add_followed_addr(req: Request, res: Response) {
    const followed_addr = req.params.addr;
    logger.info('add followed addr:', followed_addr);

    if (isValidSolanaAddress(followed_addr)) {
        let follow_user = followed_usrs.get(followed_addr);
        if (!follow_user) {
            follow_user = {
                account_addr: followed_addr,
                last_tx_hash: '11111111',
                tms: 1,
                block_number: 1,
                is_disabled: false,
            };
            followed_usrs.set(followed_addr, follow_user);
            res.send('add success');
        } else if (follow_user.is_disabled) {
            follow_user.is_disabled = false;
            res.send('add success');
        } else {
            res.status(201).send('add follow address already exist');
        }
    } else {
        res.status(201).send('addr validate failed');
    }
}

function del_followed_addr(req: Request, res: Response) {
    const followed_addr = req.params.addr;
    logger.info('del followed addr:', followed_addr);

    if (isValidSolanaAddress(followed_addr)) {
        let follow_user = followed_usrs.get(followed_addr);
        if (follow_user && !follow_user.is_disabled) {
            follow_user.is_disabled = true;
            res.send('del success');
        } else if (follow_user && follow_user.is_disabled) {
            res.status(201).send('del follow address already is disable');
        } else {
            res.status(201).send('del follow address not exist');
        }
    } else {
        res.status(201).send('addr validate failed');
    }
}

function list_followed_users(req: Request, res: Response) {
    const followeds = {
        followed_usrs: [...followed_usrs.values()],
    };

    res.send(JSON.stringify(followeds));
}

function list_follow_positions(req: Request, res: Response) {
    const followeds = {
        follow_positions: [...follow_positions.values()],
    };

    res.send(JSON.stringify(followeds));
}

function list_follow_txs(req: Request, res: Response) {
    const followeds = {
        follow_txs: [...follow_txs.values()],
    };

    res.send(JSON.stringify(followeds));
}

function isValidSolanaAddress(address: string): boolean {
    try {
        if (address.length < 32 || address.length > 44) {
            return false;
        }
        const decoded = bs58.decode(address);
        if (decoded.length !== 32) {
            return false;
        }

        return PublicKey.isOnCurve(decoded);
    } catch (error) {
        return false;
    }
}
