import { Router } from 'express';
import { checkApiStatus } from './health.controller.js';

const router = Router();
router.get('/api-status', checkApiStatus);
export default router;
