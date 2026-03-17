import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response } from 'express';
import {
    buildCourseObjectKey,
    buildFilebasePublicUrl,
    createFilebaseClient,
    getFilebaseConfig,
} from '../utils/filebase';

type GetUploadUrlBody = {
    fileName?: string;
    fileType?: string;
    courseId?: string;
};

export async function getUploadUrl(req: Request, res: Response) {
    try {
        const { fileName, fileType, courseId } = req.body as GetUploadUrlBody;

        if (!fileName || !fileType || !courseId) {
            return res.status(400).json({
                error: 'Missing required fields: fileName, fileType, and courseId are required.',
            });
        }

        const { bucketName } = getFilebaseConfig();
        const s3Client = createFilebaseClient();
        const fileKey = buildCourseObjectKey(courseId, fileName);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            // Filebase stores the uploaded content type so browsers can serve the file correctly later.
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 900,
        });

        return res.status(200).json({
            uploadUrl,
            fileUrl: buildFilebasePublicUrl(bucketName, fileKey),
        });
    } catch (error) {
        console.error('Failed to generate Filebase upload URL:', error);

        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
}
