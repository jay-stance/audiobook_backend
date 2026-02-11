import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Check if S3 is configured (credentials + bucket provided).
 */
export function isS3Configured() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && BUCKET);
}

/**
 * Upload a file buffer to S3.
 * @param {Buffer} buffer - File buffer
 * @param {string} key - S3 object key (e.g. "pdfs/abc123_myfile.pdf")
 * @param {string} contentType - MIME type
 * @returns {{ key: string, url: string }} S3 key and public URL
 */
export async function uploadToS3(buffer, key, contentType = 'application/pdf') {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });

  await s3Client.send(command);

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  return { key, url };
}

/**
 * Delete a file from S3.
 * @param {string} key - S3 object key
 */
export async function deleteFromS3(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  await s3Client.send(command);
}

export default { uploadToS3, deleteFromS3, isS3Configured };
