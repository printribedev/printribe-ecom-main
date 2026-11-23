import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/** Server-only helpers for Cloudflare R2 (it speaks the same language as Amazon S3). */

export const UPLOAD_PREFIX = 'designs/uploads/'

export const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

export const r2Configured = () =>
  !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT && process.env.R2_BUCKET && process.env.R2_PUBLIC_URL)

const client = () =>
  new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID || '', secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '' },
  })

export const publicBase = () => (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')
export const publicUrl = (key: string) => `${publicBase()}/${key}`

/** A short-lived link the browser can PUT one file to, straight into R2. The file type and size are locked in. */
export async function presignUpload(key: string, contentType: string, size: number): Promise<string> {
  return getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, ContentType: contentType, ContentLength: size }),
    { expiresIn: 300 },
  )
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  await client().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: body, ContentType: contentType }))
  return publicUrl(key)
}
