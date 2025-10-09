import express from 'express';
import { veriAl, applyLogClean } from './sync.controller.js';

const router = express.Router();

router.post('/veri-al', veriAl);
router.post('/applyLogClean', applyLogClean);

export default router;