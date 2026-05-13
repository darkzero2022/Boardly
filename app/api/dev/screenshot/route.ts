import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

// Temporary dev-only endpoint for capturing screenshots during development
// Remove before production deployment
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }
  const { name, data } = await req.json() as { name: string; data: string };
  const buf = Buffer.from(data, "base64");
  const filePath = path.join(process.cwd(), "public", "screenshots", `${name}.png`);
  await writeFile(filePath, buf);
  return NextResponse.json({ ok: true, path: `/screenshots/${name}.png` });
}
