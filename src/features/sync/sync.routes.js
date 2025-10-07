import { Router } from 'express';
import { veriAl } from './sync.controller.js';

const router = Router();
router.post('/veri-al', veriAl);
export default router;
