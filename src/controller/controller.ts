// var express = require('express');
import express from 'express';

import { folllow_mgr_router } from './follow_mgr';

const controller_router = express.Router();
controller_router.use(folllow_mgr_router);

export { controller_router };
