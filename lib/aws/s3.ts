import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awsConfig, requireAWS } from "./config";

export function s3Client() {
  return new S3Client(awsConfig("s3"));
}
export async function storeDocument(
  owner: string,
  id: string,
  content: string,
) {
  await s3Client().send(
    new PutObjectCommand({
      Bucket: requireAWS("s3", "S3_BUCKET_NAME"),
      Key: `ai-origin/${owner}/${id}.txt`,
      Body: content,
      ContentType: "text/plain; charset=utf-8",
      ServerSideEncryption: "AES256",
    }),
  );
}
export async function removeDocument(owner: string, id: string) {
  await s3Client().send(
    new DeleteObjectCommand({
      Bucket: requireAWS("s3", "S3_BUCKET_NAME"),
      Key: `ai-origin/${owner}/${id}.txt`,
    }),
  );
}
export async function presignedUpload(
  owner: string,
  contentType: string,
  size: number,
) {
  const key = `ai-origin/${owner}/uploads/${crypto.randomUUID()}`;
  const command = new PutObjectCommand({
    Bucket: requireAWS("s3", "S3_BUCKET_NAME"),
    Key: key,
    ContentType: contentType,
    ContentLength: size,
    ServerSideEncryption: "AES256",
  });
  return {
    key,
    uploadUrl: await getSignedUrl(s3Client(), command, { expiresIn: 120 }),
  };
}
