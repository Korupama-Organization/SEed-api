import { Response } from 'express';
import { APP_CONFIG } from '../constants';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CreditTransaction, User } from '../models';
import {
    PayOSPaymentLinkInformation,
    PayOSWebhookPayload,
    confirmWebhookUrl,
    createPaymentLink,
    getPaymentLinkInformation,
    verifyPayOSSignature,
} from '../utils/payos';

const ALLOWED_TOPUP_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];
const PAYOS_PROVIDER = 'payos' as const;

const formatTopupNote = (amount: number) => `Top up ${amount.toLocaleString('vi-VN')} VND via payOS`;

const buildFrontendBaseUrl = (req: AuthenticatedRequest): string => {
    const originHeader = req.get('origin');
    if (originHeader) {
        return originHeader;
    }

    const referer = req.get('referer');
    if (referer) {
        try {
            return new URL(referer).origin;
        } catch {
            // Ignore malformed referer and fall back below.
        }
    }

    return APP_CONFIG.appBaseUrl;
};

const buildBackendBaseUrl = (req: AuthenticatedRequest): string => {
    const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();
    const protocol = forwardedProto || req.protocol;
    const host = forwardedHost || req.get('host');

    if (!host) {
        return APP_CONFIG.appBaseUrl;
    }

    return `${protocol}://${host}`;
};

const isPublicWebhookUrl = (value: string): boolean => {
    try {
        const parsedUrl = new URL(value);
        if (parsedUrl.protocol !== 'https:') {
            return false;
        }

        const hostname = parsedUrl.hostname.toLowerCase();
        return !['localhost', '127.0.0.1', '::1'].includes(hostname);
    } catch {
        return false;
    }
};

const serializeTransaction = (transaction: any) => ({
    id: String(transaction._id),
    type: transaction.type,
    direction: transaction.direction,
    amount: transaction.amount,
    status: transaction.status,
    provider: transaction.provider,
    providerOrderCode: transaction.providerOrderCode,
    providerPaymentLinkId: transaction.providerPaymentLinkId,
    providerReference: transaction.providerReference,
    note: transaction.note,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
});

const generateOrderCode = async (): Promise<number> => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const orderCode = Number(`${Date.now()}${Math.floor(100 + Math.random() * 900)}`);
        const existingTransaction = await CreditTransaction.findOne({
            provider: PAYOS_PROVIDER,
            providerOrderCode: orderCode,
        }).lean();

        if (!existingTransaction) {
            return orderCode;
        }
    }

    throw new Error('Unable to generate a unique payOS order code');
};

const markTransactionFromPayOSState = async (
    transaction: any,
    paymentState: {
        status: 'completed' | 'pending' | 'cancelled';
        reference?: string;
        paymentLinkId?: string;
        note?: string;
    }
) => {
    if (!transaction) {
        return null;
    }

    const update: Record<string, unknown> = {};

    if (paymentState.paymentLinkId && !transaction.providerPaymentLinkId) {
        update.providerPaymentLinkId = paymentState.paymentLinkId;
    }

    if (paymentState.reference) {
        update.providerReference = paymentState.reference;
    }

    if (paymentState.note) {
        update.note = paymentState.note;
    }

    if (paymentState.status === 'completed' && transaction.status !== 'completed') {
        update.status = 'completed';
    }

    if (
        paymentState.status === 'cancelled' &&
        transaction.status !== 'completed' &&
        transaction.status !== 'cancelled'
    ) {
        update.status = 'cancelled';
    }

    if (Object.keys(update).length === 0) {
        return transaction;
    }

    const updatedTransaction = await CreditTransaction.findByIdAndUpdate(
        transaction._id,
        { $set: update },
        { new: true }
    );

    return updatedTransaction || transaction;
};

const mapPaymentLinkStatus = (paymentLink: PayOSPaymentLinkInformation) => {
    const normalizedStatus = String(paymentLink.status || '').toUpperCase();

    if (normalizedStatus === 'PAID') {
        return 'completed' as const;
    }

    if (normalizedStatus === 'CANCELLED' || normalizedStatus === 'EXPIRED') {
        return 'cancelled' as const;
    }

    return 'pending' as const;
};

const syncTransactionWithPayOS = async (transaction: any) => {
    if (!transaction?.providerPaymentLinkId) {
        return transaction;
    }

    const paymentLink = await getPaymentLinkInformation(transaction.providerPaymentLinkId);
    const status = mapPaymentLinkStatus(paymentLink);

    return markTransactionFromPayOSState(transaction, {
        status,
        paymentLinkId: paymentLink.id,
        note:
            status === 'completed'
                ? 'Top up completed via payOS.'
                : status === 'cancelled'
                    ? paymentLink.cancellationReason || 'Top up cancelled on payOS.'
                    : transaction.note,
    });
};

export const getWalletSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const [user, balance, recentTransactions] = await Promise.all([
            User.findById(userId).lean(),
            CreditTransaction.getAvailableBalance(userId),
            CreditTransaction.find({
                userId,
                type: 'topup',
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({
            balance,
            presetAmounts: ALLOWED_TOPUP_AMOUNTS,
            user: {
                id: String(user._id),
                fullName: user.fullName,
                email: user.email,
            },
            recentTransactions: recentTransactions.map(serializeTransaction),
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error.' });
    }
};

export const createPayOSTopup = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const amount = Number(req.body?.amount);
        if (!ALLOWED_TOPUP_AMOUNTS.includes(amount)) {
            return res.status(400).json({
                error: 'Top up amount is invalid.',
                allowedAmounts: ALLOWED_TOPUP_AMOUNTS,
            });
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const orderCode = await generateOrderCode();
        const frontendBaseUrl = buildFrontendBaseUrl(req);
        const backendBaseUrl = buildBackendBaseUrl(req);
        const returnUrl = `${frontendBaseUrl}/wallet/topup?payosStatus=success&orderCode=${orderCode}`;
        const cancelUrl = `${frontendBaseUrl}/wallet/topup?payosStatus=cancelled&orderCode=${orderCode}`;
        const description = `NAP TIEN ${orderCode}`.slice(0, 25);
        const webhookUrl = APP_CONFIG.payosWebhookUrl || `${backendBaseUrl}/api/wallet/payos/webhook`;

        if (isPublicWebhookUrl(webhookUrl)) {
            confirmWebhookUrl(webhookUrl).catch((error) => {
                console.warn('payOS webhook confirmation failed:', error.message);
            });
        } else {
            console.warn(
                'Skipping payOS webhook confirmation because PAYOS_WEBHOOK_URL is not a public https URL.'
            );
        }

        const pendingTransaction = await CreditTransaction.create({
            userId,
            type: 'topup',
            direction: 'credit',
            amount,
            status: 'pending',
            provider: PAYOS_PROVIDER,
            providerOrderCode: orderCode,
            note: formatTopupNote(amount),
        });

        try {
            const paymentLink = await createPaymentLink({
                orderCode,
                amount,
                description,
                cancelUrl,
                returnUrl,
            });

            const updatedTransaction = await CreditTransaction.findByIdAndUpdate(
                pendingTransaction._id,
                {
                    $set: {
                        providerPaymentLinkId: paymentLink.paymentLinkId,
                        note: formatTopupNote(amount),
                    },
                },
                { new: true }
            );

            return res.status(201).json({
                orderCode,
                checkoutUrl: paymentLink.checkoutUrl,
                qrCode: paymentLink.qrCode,
                transaction: serializeTransaction(updatedTransaction || pendingTransaction),
            });
        } catch (error: any) {
            await CreditTransaction.findByIdAndUpdate(pendingTransaction._id, {
                $set: {
                    status: 'failed',
                    note: error.message || 'Failed to create payOS payment link.',
                },
            });

            return res.status(502).json({
                error: error.message || 'Unable to create payOS payment link.',
            });
        }
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error.' });
    }
};

export const syncPayOSTopup = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const orderCode = Number(req.params.orderCode);
        if (!Number.isFinite(orderCode)) {
            return res.status(400).json({ error: 'Invalid order code.' });
        }

        const transaction = await CreditTransaction.findOne({
            userId,
            provider: PAYOS_PROVIDER,
            providerOrderCode: orderCode,
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Top up transaction not found.' });
        }

        const updatedTransaction = await syncTransactionWithPayOS(transaction);
        const balance = await CreditTransaction.getAvailableBalance(userId);

        return res.status(200).json({
            balance,
            transaction: serializeTransaction(updatedTransaction || transaction),
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error.' });
    }
};

export const handlePayOSWebhook = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const payload = req.body as PayOSWebhookPayload;
        if (!payload?.data?.orderCode) {
            return res.status(400).json({ error: 'Invalid webhook payload.' });
        }

        const isSignatureValid = verifyPayOSSignature(
            payload.data as unknown as Record<string, unknown>,
            payload.signature
        );

        if (!isSignatureValid) {
            return res.status(202).json({
                acknowledged: true,
                processed: false,
                reason: 'invalid_signature',
            });
        }

        const transaction = await CreditTransaction.findOne({
            provider: PAYOS_PROVIDER,
            providerOrderCode: payload.data.orderCode,
        });

        if (!transaction) {
            return res.status(200).json({
                acknowledged: true,
                processed: false,
                reason: 'transaction_not_found',
            });
        }

        const isSuccessfulPayment =
            String(payload.data.code || payload.code || '').toUpperCase() === '00' &&
            Number(payload.data.amount) === Number(transaction.amount);

        const updatedTransaction = await markTransactionFromPayOSState(transaction, {
            status: isSuccessfulPayment ? 'completed' : 'pending',
            reference: payload.data.reference,
            paymentLinkId: payload.data.paymentLinkId,
            note: isSuccessfulPayment
                ? 'Top up completed via payOS webhook.'
                : transaction.note,
        });

        return res.status(200).json({
            acknowledged: true,
            processed: true,
            transaction: serializeTransaction(updatedTransaction || transaction),
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error.' });
    }
};
