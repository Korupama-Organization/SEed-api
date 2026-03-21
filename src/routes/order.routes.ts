import { Router } from 'express';
import {
    createOrder,
    getOrderById,
    listMyOrders,
    updateOrderStatus,
} from '../controllers/order.controller';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { requireOwnership } from '../middlewares/domain-authorization.middleware';
import { Order } from '../models/Order';

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List current user orders
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Order list
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAuth, listMyOrders);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get order by id (owner only)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order detail
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/:orderId',
    requireAuth,
    requireOwnership({
        getOwnerId: async (req: AuthenticatedRequest) => {
            const row = await Order.findById(req.params.orderId).select('userId').lean();
            return row ? String(row.userId) : null;
        },
    }),
    getOrderById,
);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order for current user
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Order created
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, createOrder);

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (owner only)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch(
    '/:orderId/status',
    requireAuth,
    requireOwnership({
        getOwnerId: async (req: AuthenticatedRequest) => {
            const row = await Order.findById(req.params.orderId).select('userId').lean();
            return row ? String(row.userId) : null;
        },
    }),
    updateOrderStatus,
);

export default router;
