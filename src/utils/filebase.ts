import { S3Client } from '@aws-sdk/client-s3';

const FILEBASE_ENDPOINT = 'https://s3.filebase.com';
const FILEBASE_REGION = 'us-east-1';

type FilebaseConfig = {
    accessKey: string;
    secretKey: string;
    bucketName: string;
};

function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

export function getFilebaseConfig(): FilebaseConfig {
    return {
        accessKey: getRequiredEnv('FILEBASE_ACCESS_KEY'),
        secretKey: getRequiredEnv('FILEBASE_SECRET_KEY'),
        bucketName: getRequiredEnv('FILEBASE_BUCKET_NAME'),
    };
}

export function createFilebaseClient(config?: FilebaseConfig): S3Client {
    const { accessKey, secretKey } = config ?? getFilebaseConfig();

    return new S3Client({
        // Filebase is S3-compatible, so we point the AWS SDK at Filebase's fixed endpoint and region.
        endpoint: FILEBASE_ENDPOINT,
        region: FILEBASE_REGION,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        },
    });
}

export function sanitizeFileName(fileName: string): string {
    const safeName = fileName
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    return safeName || 'upload.bin';
}

export function sanitizeCourseId(courseId: string): string {
    const safeCourseId = courseId
        .trim()
        .replace(/[^a-zA-Z0-9/_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    return safeCourseId || 'unknown-course';
}

export function buildCourseObjectKey(courseId: string, fileName: string): string {
    const timestamp = Date.now();
    const safeCourseId = sanitizeCourseId(courseId);
    const safeFileName = sanitizeFileName(fileName);

    return `courses/${safeCourseId}/${timestamp}-${safeFileName}`;
}

export function buildFilebasePublicUrl(bucketName: string, fileKey: string): string {
    return `https://${bucketName}.s3.filebase.com/${fileKey}`;
}
