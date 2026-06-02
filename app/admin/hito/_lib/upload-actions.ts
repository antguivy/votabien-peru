"use server";

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

export async function getPresignedUrl(filename: string, contentType: string) {
  try {
    const key = `hitos/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // El frontend usará la URL presignada para hacer el PUT,
    // y luego guardará 'publicUrl' en la base de datos.
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

    return { url, publicUrl, key };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Could not generate presigned URL");
  }
}

export async function deleteFromR2(fileUrl: string) {
  try {
    // Check if the URL belongs to our bucket
    if (!fileUrl.startsWith(process.env.NEXT_PUBLIC_R2_PUBLIC_URL!)) {
      return { success: true }; // Not an R2 image, don't try to delete
    }

    const key = fileUrl.replace(
      `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/`,
      "",
    );

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error deleting from R2:", error);
    return { success: false };
  }
}
