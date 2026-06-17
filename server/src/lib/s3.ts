import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3Client;
}

/**
 * Uploads a file buffer to AWS S3 and returns the public file URL.
 * 
 * @param buffer File buffer to upload
 * @param key Unique key/path for the file in the bucket
 * @param contentType MIME type of the file
 */
export async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const bucketName = process.env.AWS_BUCKET_NAME || 'eyeglaze-bucket';
  
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  return `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
}

