import express from 'express';
import { handleIncomingData, applyLogClean } from './sync.controller.js';

const router = express.Router();

router.post('/apply-changes', handleIncomingData);
router.post('/applyLogClean', applyLogClean);

export default router;