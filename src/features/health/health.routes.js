import { Router } from 'express';
import { apiDurumuGetir } from './health.controller.js';

const router = Router();
router.get('/api-status', apiDurumuGetir);
export default router;
