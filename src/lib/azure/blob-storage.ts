// src/lib/azure/blob-storage.ts

import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";

function getContainerClient(): ContainerClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!connectionString || !containerName) {
    throw new Error(
      "Azure Blob Storage no configurado: verifique AZURE_STORAGE_CONNECTION_STRING y AZURE_STORAGE_CONTAINER_NAME",
    );
  }

  const serviceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  return serviceClient.getContainerClient(containerName);
}

export async function uploadBlob(
  blobName: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const containerClient = getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlobClient.url;
}

export async function deleteBlob(blobName: string): Promise<void> {
  const containerClient = getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

export function buildBlobName(
  folder: string,
  requestId: string,
  fileName: string,
): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${folder}/${requestId}/${timestamp}-${sanitized}`;
}
