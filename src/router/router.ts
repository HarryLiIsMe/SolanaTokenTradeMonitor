import { controller_router } from '@/controller/controller';
import { logger } from '../logger';
import express from 'express';

var router = express.Router();
router.use(controller_router);

export { router };
