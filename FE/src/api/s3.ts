/**
 * S3 이미지 업로드 유틸리티
 *
 * 흐름:
 *   1. AWS credentials로 클라이언트에서 presigned URL 생성
 *   2. 해당 URL로 파일 직접 PUT 업로드
 *   3. 반환된 fileName(이미지명.jpg)을 API 요청 시 사용
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = import.meta.env.VITE_AWS_S3_BUCKET as string;

/**
 * 이미지 파일을 S3에 업로드하고 파일명을 반환합니다.
 * @param file 업로드할 이미지 파일
 * @returns 업로드된 파일명 (예: "1234567890_abc12345.jpg")
 */
export async function uploadImageToS3(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileName,
    ContentType: file.type,
  });

  // 클라이언트 측에서 presigned URL 생성 (백엔드 불필요)
  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  return fileName;
}
