import crypto from 'crypto';

const PAYOS_BASE_URL = process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn';

type Primitive = string | number | boolean | null;

interface PayOSResponse<T> {
    code: string;
    desc: string;
    success?: boolean;
    data: T;
    signature?: string;
}

export interface PayOSCreatePaymentLinkPayload {
    orderCode: number;
    amount: number;
    description: string;
    cancelUrl: string;
    returnUrl: string;
}

export interface PayOSCreatePaymentLinkResponse {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
}

export interface PayOSPaymentLinkInformation {
    id: string;
    orderCode: number;
    amount: number;
    amountPaid: number;
    amountRemaining: number;
    status: string;
    createdAt: string;
    canceledAt?: string;
    cancellationReason?: string;
    transactions?: unknown[];
}

export interface PayOSWebhookData {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber?: string;
    reference?: string;
    transactionDateTime?: string;
    currency?: string;
    paymentLinkId?: string;
    code?: string;
    desc?: string;
    counterAccountBankId?: string;
    counterAccountBankName?: string;
    counterAccountName?: string;
    counterAccountNumber?: string;
    virtualAccountName?: string;
    virtualAccountNumber?: string;
}

export interface PayOSWebhookPayload {
    code?: string;
    desc?: string;
    success?: boolean;
    data?: PayOSWebhookData;
    signature?: string;
}

const getRequiredEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is required`);
    }

    return value;
};

const getApiHeaders = (includeIdempotency = false): Record<string, string> => {
    const clientId = getRequiredEnv('PAYOS_CLIENT_ID');
    const apiKey = getRequiredEnv('PAYOS_API_KEY');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-client-id': clientId,
    };

    if (includeIdempotency) {
        headers['x-idempotency-key'] = crypto.randomUUID();
    }

    return headers;
};

const sortObject = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(sortObject);
    }

    if (value && typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>)
            .sort()
            .reduce<Record<string, unknown>>((accumulator, key) => {
                const nestedValue = (value as Record<string, unknown>)[key];

                if (nestedValue === undefined) {
                    return accumulator;
                }

                accumulator[key] = sortObject(nestedValue);
                return accumulator;
            }, {});
    }

    return value;
};

const stringifyValue = (value: unknown): string => {
    if (value === null) {
        return '';
    }

    if (Array.isArray(value) || typeof value === 'object') {
        return JSON.stringify(sortObject(value));
    }

    return String(value as Primitive);
};

export const serializePayOSData = (data: Record<string, unknown>): string => {
    return Object.entries(sortObject(data) as Record<string, unknown>)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${stringifyValue(value)}`)
        .join('&');
};

export const createPayOSSignature = (data: Record<string, unknown>): string => {
    const checksumKey = getRequiredEnv('PAYOS_CHECKSUM_KEY');
    return crypto
        .createHmac('sha256', checksumKey)
        .update(serializePayOSData(data))
        .digest('hex');
};

export const verifyPayOSSignature = (
    data: Record<string, unknown>,
    signature: string | undefined
): boolean => {
    if (!signature) {
        return false;
    }

    const expectedSignature = createPayOSSignature(data);
    if (expectedSignature.length !== signature.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
    );
};

const readPayOSResponse = async <T>(response: Response): Promise<PayOSResponse<T>> => {
    const payload = (await response.json()) as PayOSResponse<T> & { message?: string; error?: string };

    if (!response.ok) {
        throw new Error(payload.desc || payload.message || payload.error || 'payOS request failed');
    }

    if (payload.code && payload.code !== '00') {
        throw new Error(payload.desc || 'payOS returned a non-success response');
    }

    return payload;
};

const requestPayOS = async <T>(
    path: string,
    init?: RequestInit,
    options?: { includeIdempotency?: boolean }
): Promise<PayOSResponse<T>> => {
    const response = await fetch(`${PAYOS_BASE_URL}${path}`, {
        ...init,
        headers: {
            ...getApiHeaders(options?.includeIdempotency),
            ...(init?.headers || {}),
        },
    });

    return readPayOSResponse<T>(response);
};

export const createPaymentLink = async (
    payload: PayOSCreatePaymentLinkPayload
): Promise<PayOSCreatePaymentLinkResponse> => {
    const body = {
        ...payload,
        signature: createPayOSSignature(payload as unknown as Record<string, unknown>),
    };

    const response = await requestPayOS<PayOSCreatePaymentLinkResponse>(
        '/v2/payment-requests',
        {
            method: 'POST',
            body: JSON.stringify(body),
        },
        { includeIdempotency: true }
    );

    return response.data;
};

export const getPaymentLinkInformation = async (
    paymentLinkId: string
): Promise<PayOSPaymentLinkInformation> => {
    const response = await requestPayOS<PayOSPaymentLinkInformation>(
        `/v2/payment-requests/${paymentLinkId}`,
        { method: 'GET' }
    );

    return response.data;
};

export const confirmWebhookUrl = async (webhookUrl: string) => {
    const response = await requestPayOS<{ webhookUrl: string }>(
        '/confirm-webhook',
        {
            method: 'POST',
            body: JSON.stringify({ webhookUrl }),
        }
    );

    return response.data;
};
