// src/app/api/uploads/[...path]/route.ts

import { readFile } from "fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { join } from "path";

const UPLOAD_BASE_PATH =
  process.env.UPLOAD_BASE_PATH || "/var/www/club-administrator/uploads";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const filePath = join(UPLOAD_BASE_PATH, ...path);

    const file = await readFile(filePath);

    const ext = path[path.length - 1].split(".").pop()?.toLowerCase();
    const contentType = getContentType(ext || "");

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Archivo no encontrado" },
      { status: 404 },
    );
  }
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };

  return types[ext] || "application/octet-stream";
}
