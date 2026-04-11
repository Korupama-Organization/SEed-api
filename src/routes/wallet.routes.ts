import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
    createPayOSTopup,
    getWalletSummary,
    handlePayOSWebhook,
    syncPayOSTopup,
} from '../controllers/wallet.controller';

const router = Router();

router.post('/payos/webhook', handlePayOSWebhook);
router.get('/summary', requireAuth, getWalletSummary);
router.post('/topups/payos/create', requireAuth, createPayOSTopup);
router.post('/topups/:orderCode/sync', requireAuth, syncPayOSTopup);

export default router;
