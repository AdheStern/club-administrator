import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";

const UPLOAD_BASE_PATH = process.env.UPLOAD_BASE_PATH || "./public/uploads";

type UploadType = "events" | "payment-qr";

async function ensureDirectory(directory: UploadType): Promise<string> {
  const dirPath = join(UPLOAD_BASE_PATH, directory);
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
  return dirPath;
}

export async function saveFile(file: File, type: UploadType): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop();
  const filename = `${crypto.randomUUID()}.${ext}`;

  const dirPath = await ensureDirectory(type);
  const filePath = join(dirPath, filename);

  await writeFile(filePath, buffer);

  return `${type}/${filename}`;
}

export async function deleteFile(relativePath: string): Promise<void> {
  try {
    const filePath = join(UPLOAD_BASE_PATH, relativePath);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}
