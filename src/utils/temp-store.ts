type TempEntry = {
    value: string;
    expiresAtMs: number;
    timeout: NodeJS.Timeout;
};

const tempValues = new Map<string, TempEntry>();

const clearEntry = (key: string, entry: TempEntry): void => {
    clearTimeout(entry.timeout);
    tempValues.delete(key);
};

const getValidEntry = (key: string): TempEntry | null => {
    const entry = tempValues.get(key);
    if (!entry) {
        return null;
    }

    if (entry.expiresAtMs <= Date.now()) {
        clearEntry(key, entry);
        return null;
    }

    return entry;
};

export const setTempValue = async (key: string, value: string, ttlSeconds: number): Promise<void> => {
    const existing = tempValues.get(key);
    if (existing) {
        clearTimeout(existing.timeout);
    }

    const ttlMs = Math.max(ttlSeconds, 1) * 1000;
    const timeout = setTimeout(() => {
        tempValues.delete(key);
    }, ttlMs);
    timeout.unref();

    tempValues.set(key, {
        value,
        expiresAtMs: Date.now() + ttlMs,
        timeout,
    });
};

export const getTempValue = async (key: string): Promise<string | null> => {
    return getValidEntry(key)?.value ?? null;
};

export const deleteTempValue = async (key: string): Promise<void> => {
    const entry = tempValues.get(key);
    if (entry) {
        clearEntry(key, entry);
    }
};

export const existsTempValue = async (key: string): Promise<boolean> => {
    return getValidEntry(key) !== null;
};

export const setTempValueIfAbsent = async (key: string, value: string, ttlSeconds: number): Promise<boolean> => {
    if (getValidEntry(key)) {
        return false;
    }

    await setTempValue(key, value, ttlSeconds);
    return true;
};

export const refreshTempValueIfMatch = async (
    key: string,
    expectedValue: string,
    ttlSeconds: number,
): Promise<boolean> => {
    const entry = getValidEntry(key);
    if (!entry || entry.value !== expectedValue) {
        return false;
    }

    await setTempValue(key, expectedValue, ttlSeconds);
    return true;
};

export const deleteTempValueIfMatch = async (key: string, expectedValue: string): Promise<boolean> => {
    const entry = getValidEntry(key);
    if (!entry || entry.value !== expectedValue) {
        return false;
    }

    clearEntry(key, entry);
    return true;
};
