import { Router } from 'express';
import {
    createCreditTopup,
    getCreditBalance,
    listCreditTransactions,
} from '../controllers/credit-transaction.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/credit-transactions/balance:
 *   get:
 *     summary: Get current user credit balance
 *     tags: [CreditTransactions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Credit balance
 *       401:
 *         description: Unauthorized
 */
router.get('/balance', requireAuth, getCreditBalance);

/**
 * @swagger
 * /api/credit-transactions:
 *   get:
 *     summary: List current user credit transactions
 *     tags: [CreditTransactions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Credit transaction list
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAuth, listCreditTransactions);

/**
 * @swagger
 * /api/credit-transactions/topup:
 *   post:
 *     summary: Top up current user credit
 *     tags: [CreditTransactions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100000
 *               note:
 *                 type: string
 *                 example: Wallet topup
 *     responses:
 *       201:
 *         description: Topup transaction created
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post('/topup', requireAuth, createCreditTopup);

export default router;
