import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

export async function createProductImageUploadUrl(fileType: string) {
  if (!env.awsS3Bucket) {
    throw new HttpError(400, 'AWS_S3_BUCKET is not configured');
  }

  const extension = fileType.split('/')[1] ?? 'jpg';
  const key = `products/${crypto.randomUUID()}.${extension}`;
  const client = new S3Client({ region: env.awsRegion });
  const command = new PutObjectCommand({
    Bucket: env.awsS3Bucket,
    Key: key,
    ContentType: fileType
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
  const publicUrl = `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
  return { uploadUrl, publicUrl, key };
}
